const { chromium } = require("playwright");

/**
 * Scrapes the most relevant LinkedIn company link for a given company name.
 *
 * @param {string} companyName - The name of the company to search for
 * @returns {Promise<{ company: string, linkedin: string | null, success: boolean }>}
 */
async function scrapeCompany(companyName) {
  if (!companyName) throw new Error("Missing company name");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    const query = `${companyName} LinkedIn Profile`;

    await page.goto("https://www.bing.com");
    await page.waitForSelector("#sb_form_q", { timeout: 10000 });

    await page.fill("#sb_form_q", "");
    await page.type("#sb_form_q", query, { delay: 100 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(8000);

    const firstLink = await page.$eval("li.b_algo a", (anchor) => anchor.href.trim());

    await page.goto(firstLink);
    await page.waitForTimeout(10000);
    // Just to make sure that we're on the right page :)
    await page.screenshot({ path: `screenshots/${companyName}.png` });
    const currentUrl = page.url();

    const regex = /^https:\/\/[a-z]{2}\.linkedin\.com/;
    const linkedInUrl = "https://www.linkedin.com";
    const normalizedUrl = currentUrl.replace(regex, linkedInUrl);

    return {
      company: companyName,
      linkedin: normalizedUrl,
      success: Boolean(normalizedUrl),
    };
  } catch (error) {
    throw new Error(`LinkedIn scraping failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = scrapeCompany;
