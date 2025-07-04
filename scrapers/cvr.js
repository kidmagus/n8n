
const { chromium } = require('playwright');

/**
 * Scrapes the CVR number of a company from TheRightPeople.
 * Logs into the site using provided credentials, searches for the company by name, and extracts the CVR number.
 *
 * @param {string} username - Login username for TheRightPeople
 * @param {string} password - Login password for TheRightPeople
 * @param {string} company - The name of the company to search for
 * @returns {Promise<{ CompanyName: string, 'Company CVR': string }>}
 */
module.exports = async function scrapeCVR(username, password, company) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    await page.goto('https://therightpeople.dk/login.aspx', { waitUntil: 'load' });
    await page.fill('#Username', username);
    await page.fill('#Password', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // Navigate to company info
    await page.goto('https://therightpeople.dk/datamanager.aspx#/companyinfo', { waitUntil: 'networkidle' });

    // Find visible company input
    const inputBox = await findVisibleLocator(page, 'input[placeholder="Eks. Danfoss A/S"]');
    if (!inputBox) throw new Error('No visible input field found for company search.');

    await inputBox.fill(company);

    // Find and click visible search button
    const searchButton = await findVisibleLocator(page, '#search');
    if (!searchButton) throw new Error('No visible search button found.');

    await searchButton.click();
    await page.waitForTimeout(4000);

    // Extract CVR number from text content
    const textContent = await page.locator('.ng-binding').allTextContents();
    const cvr = textContent.map(t => t.match(/\b\d{8}\b/)?.[0]).find(Boolean) || 'CVR not found';

    return {
      CompanyName: company,
      'Company CVR': cvr
    };
  } catch (err) {
    await page.screenshot({ path: 'cvr-error.png', fullPage: true });
    throw new Error(`CVR scraping failed: ${err.message}`);
  } finally {
    await browser.close();
  }
};

/**
 * Utility: Finds the first visible element matching the selector
 * @param {import('playwright').Page} page
 * @param {string} selector
 * @returns {Promise<import('playwright').Locator | null>}
 */
async function findVisibleLocator(page, selector) {
  const elements = page.locator(selector);
  const count = await elements.count();
  for (let i = 0; i < count; i++) {
    const el = elements.nth(i);
    if (await el.isVisible()) {
      return el;
    }
  }
  return null;
}
