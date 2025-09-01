import express from "express";
import { scrapeCVR } from "./scrapers/cvr";
import { scrapeEmployee } from "./scrapers/employee";
import { scrapeCompany } from "./scrapers/company";

/**
 *  Scrapes cvr , employee and company from TheRightPeople and Bing (company search)
 *  No need to use 'pm2 start src/server.ts' or 'pm2 start server.js'
 *  In order to run this just 'ts-node src/server.ts' wait for compilation and;
 *  run ngrok http --domain=mullet-mature-swan.ngrok-free.app 3000 (my personal domain currently)
 *
 */

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root endpoint
app.get("/", (_req, res) => {
  res.send("Unified TRP Scraper is running!");
});

// Utility function to handle missing fields
const validateFields = (fields: string[], body: any, res: any) => {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });
  }
  return null;
};

/**
 * POST /scrape-cvr
 * Logs into TheRightPeople and extracts the CVR number using company name.
 * Expects: { username, password, company }
 */
app.post("/scrape-cvr", async (req: express.Request, res: express.Response) => {
  if (validateFields(["username", "password", "company"], req.body, res)) return;
  const { username, password, company } = req.body;

  try {
    const result = await scrapeCVR(username, password, company);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
});

/**
 * POST /scrape-employee
 * Scrapes employee data (CXO, Board, etc.) using CVR.
 * Expects: { username, password, cvr }
 */
app.post("/scrape-employee", async (req: express.Request, res: express.Response) => {
  if (validateFields(["username", "password", "cvr"], req.body, res)) return;
  const { username, password, cvr } = req.body;

  try {
    const result = await scrapeEmployee(username, password, cvr);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
});

/**
 * POST /scrape-company
 * Scrapes public company data using company name.
 * Expects: { company }
 */
app.post("/scrape-company", async (req: express.Request, res: express.Response) => {
  if (validateFields(["company"], req.body, res)) return;
  const { company } = req.body;

  try {
    const result = await scrapeCompany(company);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Unified TRP Scraper running at http://localhost:${PORT}`);
});


//** For it to run it's pm2  */ 
//**  ts-node src/server.ts */ 
