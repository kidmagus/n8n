const express = require('express');
const scrapeCVR = require('./scrapers/cvr');
const scrapeEmployee = require('./scrapers/employee');
const scrapeCompany = require('./scrapers/company'); 

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Unified TRP Scraper is running!');
});

/**
 * POST /scrape-cvr
 * Logs in to TheRightPeople and extracts the CVR number of a company by name.
 * @body {string} username - TheRightPeople login username
 * @body {string} password - TheRightPeople login password
 * @body {string} company - Company name to search for
 */

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

/**
 * POST /scrape-employee
 * Logs in to TheRightPeople and scrapes employee data (CXO, Board, Directors) by CVR.
 * @body {string} username - TheRightPeople login username
 * @body {string} password - TheRightPeople login password
 * @body {string} cvr - Company CVR number
 */

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

/**
 * POST /scrape-company
 * Scrapes company data from a public or third-party source using company name.
 * @body {string} company - Company name
 */

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
