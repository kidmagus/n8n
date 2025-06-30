const express = require('express');
const scrapeCVR = require('./scrapers/cvr');
const scrapeEmployee = require('./scrapers/employee');
const scrapeCompany = require('./scrapers/company'); 

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Unified TRP Scraper is running!');
});

app.post('/scrape-cvr', async (req, res) => {
  const { username, password, company } = req.body;
  if (!username || !password || !company) {
    return res.status(400).json({ error: 'Missing username, password, or company' });
  }

  try {
    const result = await scrapeCVR(username, password, company);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/scrape-employee', async (req, res) => {
  const { username, password, cvr } = req.body;
  if (!username || !password || !cvr) {
    return res.status(400).json({ error: 'Missing username, password, or cvr' });
  }

  try {
    const result = await scrapeEmployee(username, password, cvr);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/scrape-company', async (req, res) => {
  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: 'Missing company' });
  }

  try {
    const result = await scrapeCompany(company);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Unified server running on http://localhost:3000');
});
