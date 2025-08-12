import { chromium } from "playwright";

export interface ScrapeCompanyResult {
  company: string;
  linkedin: string | null;
  success: boolean;
}

export async function scrapeCompany(companyName: string): Promise<ScrapeCompanyResult> {
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

    // Get the href of the first anchor inside li.b_algo
    const firstLink = await page.$eval("li.b_algo a", (anchor: HTMLAnchorElement) => anchor.href.trim());

    await page.goto(firstLink);
    await page.waitForTimeout(15000);
    await page.screenshot({ path: `screenshots/${companyName}.png` });
    const currentUrl = page.url();

    // Replace localized domain :>
    const regex = /^https:\/\/[a-z]{2}\.linkedin\.com/;
    const linkedinUrl = "https://www.linkedin.com";
    const normalizedUrl = currentUrl.replace(regex, linkedinUrl);

    return {
      company: companyName,
      linkedin: normalizedUrl || null,
      success: Boolean(normalizedUrl),
    };
  } catch (error: unknown) {
    throw new Error(`LinkedIn scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    await browser.close();
  }
}
