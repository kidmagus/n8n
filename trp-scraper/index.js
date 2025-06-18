const express = require('express');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TRP Scraper is running!');
});

app.post('/scrape-cvr', async (req, res) => {
  const { company, username, password } = req.body;

  const user = username || process.env.USERNAME;
  const pass = password || process.env.PASSWORD;

  if (!user || !pass || !company) {
    return res.status(400).json({ error: 'Missing username, password, or company' });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Replace the selectors below with the actual ones from TheRightPeople
    await page.goto('https://therightpeople.com/login', { waitUntil: 'networkidle' });

    await page.fill('#username', user); // update selector
    await page.fill('#password', pass); // update selector
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto(`https://therightpeople.com/search?q=${encodeURIComponent(company)}`, { waitUntil: 'networkidle' });

    await page.waitForSelector('.cvr-selector'); // update selector
    const cvr = await page.textContent('.cvr-selector'); // update selector

    res.json({ cvr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TRP Scraper running on port ${PORT}`);
});
