const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TRP Scraper is running!');
});

app.post('/scrape-cvr', async (req, res) => {
  const { username, password, company } = req.body;
  if (!username || !password || !company) {
    return res.status(400).json({ error: 'Missing username, password, or company' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login
    await page.goto('https://therightpeople.dk/login.aspx', { waitUntil: 'load' });
    await page.fill('#Username', username);
    await page.fill('#Password', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // 2. Go to company info page
    await page.goto('https://therightpeople.dk/datamanager.aspx#/companyinfo', { waitUntil: 'networkidle' });

    // 3. Find visible input
    const inputs = page.locator('input[placeholder="Eks. Danfoss A/S"]');
    const count = await inputs.count();
    let targetInput = null;
    for (let i = 0; i < count; i++) {
      const el = inputs.nth(i);
      if (await el.isVisible()) {
        targetInput = el;
        break;
      }
    }

    if (!targetInput) throw new Error('Visible input for company not found.');
    await targetInput.fill(company);

    // 4. Click visible search button
    const searchButtons = page.locator('#search');
    const btnCount = await searchButtons.count();
    let visibleBtn = null;
    for (let i = 0; i < btnCount; i++) {
      const btn = searchButtons.nth(i);
      if (await btn.isVisible()) {
        visibleBtn = btn;
        break;
      }
    }

    if (!visibleBtn) throw new Error('Visible search button not found.');
    await visibleBtn.click();

    // 5. Wait for search result
    await page.waitForTimeout(4000); // allow Angular to render

    const allTexts = await page.locator('.ng-binding').allTextContents();
    console.log('📄 Texts:', allTexts); // optional debugging

    // 6. Extract CVR from text
    const cvr = allTexts.map(t => t.match(/\b\d{8}\b/)?.[0]).find(Boolean) || 'CVR not found';

    // 7. Respond with formatted JSON
    res.json({
      CompanyName: company,
      'Company CVR': cvr
    });

  } catch (err) {
    await page.screenshot({ path: 'error.png', fullPage: true });
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
