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
    return res.status(400).json({
      error: 'Missing username, password, or company in request body',
    });
  }

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to TRP login...');
    await page.goto('https://therightpeople.com/login', { waitUntil: 'domcontentloaded' });

    // Replace with correct selectors if needed
    await page.fill('input[name="username"], input#username', username);
    await page.fill('input[name="password"], input#password', password);
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Logged in.');

    // Go to company search
    const searchUrl = `https://therightpeople.com/search?q=${encodeURIComponent(company)}`;
    console.log('Navigating to:', searchUrl);
    await page.goto(searchUrl);
    await page.waitForSelector('.cvr-selector', { timeout: 10000 });

    const cvr = await page.textContent('.cvr-selector');
    console.log('CVR found:', cvr);

    res.json({ cvr });

  } catch (err) {
    console.error('Error during scrape:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ TRP Scraper running on port ${PORT}`);
});
