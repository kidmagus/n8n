const { chromium } = require('playwright');

/**
 * Scrape the most relevant LinkedIn link for a company name.
 * @param {string} companyName
 * @returns {Promise<{ company: string, linkedin: string|null, success: boolean }>}
 */
async function scrapeCompany(companyName) {
  if (!companyName) throw new Error('Missing company');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    const query = `${companyName} LinkedIn`;
    await page.goto('https://www.bing.com');
    await page.waitForSelector('#sb_form_q', { timeout: 10000 });
    await page.fill('#sb_form_q', '');
    await page.type('#sb_form_q', query, { delay: 100 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    const links = await page.$$eval('li.b_algo a', anchors =>
      anchors
        .map(a => a.href.trim())
        .filter(href => {
          const lower = href.toLowerCase();
          return (
            lower.includes('linkedin.com/company') ||
            lower.includes('linkedin.com/in') ||
            lower.includes('linkedin.com/public-profile') ||
            lower.includes('linkedin.com/profile') ||
            lower.includes('linkedin.com/') ||
            lower.includes('dk.linkedin.com/company')
          );
        })
    );

    function rankLinkedInLink(link, query) {
      const cleanQuery = query.toLowerCase().replace(/[^\w\s]/gi, '');
      const slugQuery = cleanQuery.replace(/\s+/g, '');
      link = link.toLowerCase();

      let score = 0;
      if (link.includes('linkedin.com/company')) score += 6;
      if (link.includes('linkedin.com/in')) score += 3;
      if (link.includes('linkedin.com')) score += 2;
      if (link.includes(slugQuery)) score += 3;
      if (link.includes(cleanQuery.split(' ')[0])) score += 1;

      return score;
    }

    const ranked = links
      .map(link => ({ link, score: rankLinkedInLink(link, companyName) }))
      .sort((a, b) => b.score - a.score);

    const bestLink = ranked.length > 0 ? ranked[0].link : null;

    return {
      company: companyName,
      linkedin: bestLink,
      success: !!bestLink,
    };
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = scrapeCompany;
