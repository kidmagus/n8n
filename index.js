const express = require('express');
const { chromium } = require('playwright-core'); // use playwright-core
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('TRP Scraper is running!');
});

app.post('/scrape-cvr', async (req, res) => {
  const { username, password, company } = req.body;

  if (!username || !password || !company) {
    return res.status(400).json({ error: 'Missing username, password, or company in request body' });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser' // <- THIS is the key fix
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://therightpeople.com/login');
    await page.fill('#username', username); // update selector if needed
    await page.fill('#password', password); // update selector if needed
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto(`https://therightpeople.com/search?q=${encodeURIComponent(company)}`);
    await page.waitForSelector('.cvr-selector'); // update selector to actual
    const cvr = await page.textContent('.cvr-selector'); // update selector to actual

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
