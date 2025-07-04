const { chromium } = require('playwright');

/**
 * Scrapes the most relevant LinkedIn company link for a given company name.
 *
 * @param {string} companyName - The name of the company to search for
 * @returns {Promise<{ company: string, linkedin: string | null, success: boolean }>}
 */
async function scrapeCompany(companyName) {
  if (!companyName) throw new Error('Missing company name');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    const query = `${companyName} LinkedIn Profile`;

    await page.goto('https://www.bing.com');
    await page.waitForSelector('#sb_form_q', { timeout: 10000 });

    await page.fill('#sb_form_q', '');
    await page.type('#sb_form_q', query, { delay: 100 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);

    const links = await page.$$eval('li.b_algo a', anchors =>
      anchors
        .map(a => a.href.trim())
        .filter(href => href.includes('linkedin.com/company'))
    );

    const bestLink = rankAndSelectBestLink(links, companyName);

    return {
      company: companyName,
      linkedin: bestLink,
      success: Boolean(bestLink),
    };
  } catch (error) {
    throw new Error(`LinkedIn scraping failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

function rankAndSelectBestLink(links, query) {
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
  const slugQuery = cleanQuery.replace(/\s+/g, '');

  const ranked = links.map(link => {
    const l = link.toLowerCase();
    let score = 0;
    if (l.includes('linkedin.com/company')) score += 5;
    if (l.includes(slugQuery)) score += 3;
    if (l.includes(cleanQuery.split(' ')[0])) score += 1;
    return { link, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.length > 0 ? ranked[0].link : null;
}

module.exports = scrapeCompany;
