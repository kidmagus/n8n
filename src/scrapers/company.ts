import { chromium } from "playwright";

export interface ScrapeCompanyResult {
  company: string;
  linkedin: string | null;
  success: boolean;
}

export async function scrapeCompany(
  companyName: string
): Promise<ScrapeCompanyResult> {
  if (!companyName) throw new Error("Missing company name");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    const query = `${companyName} LinkedIn Profile`;

    // Go to DuckDuckGo
    await page.goto("https://duckduckgo.com/");
    await page.waitForSelector("input[name='q']", { timeout: 20000 });

    // Search
    await page.fill("input[name='q']", query);
    await page.keyboard.press("Enter");

    // Wait for results
    await page.waitForSelector(".react-results--main", { timeout: 20000 });

    // Get the first search result link
    const firstLink = await page.$eval(
      "a[data-testid='result-title-a']",
      (a: HTMLAnchorElement) => a.href.trim()
    );

    // Go to that link
    await page.goto(firstLink, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(10000);

    // Save screenshot
    await page.screenshot({ path: `screenshots/${companyName}.png` });

    const currentUrl = page.url();

    // Normalize LinkedIn URL
    const regex = /^https:\/\/[a-z]{2}\.linkedin\.com/;
    const linkedinUrl = "https://www.linkedin.com";
    const normalizedUrl = currentUrl.replace(regex, linkedinUrl);

    return {
      company: companyName,
      linkedin: normalizedUrl || null,
      success: Boolean(normalizedUrl),
    };
  } catch (error: unknown) {
    throw new Error(
      `LinkedIn scraping failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    await browser.close();
  }
}
