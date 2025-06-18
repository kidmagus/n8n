const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TRP Scraper is running!');
});

app.post('/scrape-cvr', async (req, res) => {
  const { username, password, company } = req.body;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://therightpeople.com/login');
    await page.fill('#username', username); // replace with correct selector
    await page.fill('#password', password); // replace with correct selector
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto(`https://therightpeople.com/search?q=${encodeURIComponent(company)}`);
    await page.waitForSelector('.cvr-selector'); // change this
    const cvr = await page.textContent('.cvr-selector'); // change this

    res.json({ cvr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

app.listen(3000, () => {
  console.log('Scraper running on port 3000');
});
