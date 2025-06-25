const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TRP Scraper is running!');
});

app.post('/scrape-employee', async (req, res) => {
  const { username, password, cvr } = req.body;
  if (!username || !password || !cvr) {
    return res.status(400).json({ error: 'Missing username, password, or cvr' });
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

    // 2. Navigate to company info search
    await page.goto('https://therightpeople.dk/datamanager.aspx#/companyinfo', { waitUntil: 'networkidle' });

    // 3. Wait and find the visible CVR input
    await page.waitForTimeout(5000); // let Angular render
    const cvrInputs = page.locator('#txtCVR');
    const inputCount = await cvrInputs.count();
    let visibleCVRInput = null;

    for (let i = 0; i < inputCount; i++) {
      const el = cvrInputs.nth(i);
      if (await el.isVisible()) {
        visibleCVRInput = el;
        break;
      }
    }

    if (!visibleCVRInput) throw new Error('#txtCVR input is not visible after waiting.');
    await visibleCVRInput.fill(cvr);
    await page.keyboard.press('Enter');

    // 4. Wait for company info to render
    await page.waitForTimeout(5000);

    // 5. Get company name and CVR from the page
    const companyName = await page.locator('h2.ng-binding').first().textContent();
    const allTexts = await page.locator('.ng-binding').allTextContents();
    const companyCVR = allTexts.map(t => t.match(/\b\d{8}\b/)?.[0]).find(Boolean) || 'CVR not found';

    // 6. Extract employee info for given section
    const extractPeopleFromSection = async (sectionName) => {
      const people = [];

      const sectionTbody = page.locator(`tbody:has-text("${sectionName}")`);
      const personRows = sectionTbody.locator('tr.ng-scope');

      const rowCount = await personRows.count();
      for (let i = 0; i < rowCount; i += 2) {
        const row = personRows.nth(i);
        const cols = row.locator('td');
        const position = await cols.nth(0).innerText();
        const firstName = await cols.nth(3).innerText();
        const lastName = await cols.nth(4).innerText();
        const phone = await cols.nth(5).innerText();
        const email = await cols.nth(7).innerText();

        const linkRow = personRows.nth(i + 1);
        const linkCols = linkRow.locator('td a');
        let linkedin = '';

        const linkCount = await linkCols.count();
        for (let j = 0; j < linkCount; j++) {
          const link = linkCols.nth(j);
          const href = await link.getAttribute('href');
          if (href?.includes('linkedin.com')) {
            linkedin = href;
            break;
          }
        }

        people.push({
          name: `${firstName} ${lastName}`,
          position: position.trim(),
          phone: phone.trim(),
          email: email.trim(),
          linkedin,
        });
      }

      return people;
    };

    const cxoPeople = await extractPeopleFromSection('CXO');
    const boardPeople = await extractPeopleFromSection('Bestyrelse');

    res.json({
      CompanyName: companyName?.trim(),
      'Company CVR': companyCVR,
      CXO: cxoPeople,
      Bestyrelse: boardPeople
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
