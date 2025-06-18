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
  const page = await browser.newPage();

  try {
    console.log('Navigating to TRP login...');
    await page.goto('https://therightpeople.com/login', { waitUntil: 'domcontentloaded' });

    // TODO: Replace these selectors if TRP uses different IDs or names
    await page.fill('input[name="username"], input#username', username);
    await page.fill('input[name="password"], input#password', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    console.log('Logged in. Searching for company...');
    await page.goto(`https://therightpeople.com/search?q=${encodeURIComponent(company)}`);
    await page.waitForSelector('.cvr-selector', { timeout: 10000 }); // Update selector as needed

    const cvr = await page.textContent('.cvr-selector'); // Update selector as needed
    console.log('Found CVR:', cvr);

    res.json({ cvr });

  } catch (err) {
    console.error('Scraping failed:', err);
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Scraper running on port ${PORT}`);
});
