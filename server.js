const express = require('express');
const scrapeCVR = require('./scrapers/cvr');
const scrapeEmployee = require('./scrapers/employee');
const scrapeCompany = require('./scrapers/company');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root endpoint
app.get('/', (_req, res) => {
  res.send('Unified TRP Scraper is running!');
});

// Utility function to handle missing fields
const validateFields = (fields, body, res) => {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });
  }
  return null;
};

/**
 * POST /scrape-cvr
 * Logs into TheRightPeople and extracts the CVR number using company name.
 * Expects: { username, password, company }
 */
app.post('/scrape-cvr', async (req, res) => {
  if (validateFields(['username', 'password', 'company'], req.body, res)) return;
  const { username, password, company } = req.body;

  try {
    const result = await scrapeCVR(username, password, company);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /scrape-employee
 * Scrapes employee data (CXO, Board, etc.) using CVR.
 * Expects: { username, password, cvr }
 */
app.post('/scrape-employee', async (req, res) => {
  if (validateFields(['username', 'password', 'cvr'], req.body, res)) return;
  const { username, password, cvr } = req.body;

  try {
    const result = await scrapeEmployee(username, password, cvr);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /scrape-company
 * Scrapes public company data using company name.
 * Expects: { company }
 */
app.post('/scrape-company', async (req, res) => {
  if (validateFields(['company'], req.body, res)) return;
  const { company } = req.body;

  try {
    const result = await scrapeCompany(company);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Unified TRP Scraper running at http://localhost:${PORT}`);
});
