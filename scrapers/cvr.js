const { chromium } = require('playwright');

module.exports = async function scrapeCVR(username, password, company) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://therightpeople.dk/login.aspx', { waitUntil: 'load' });
    await page.fill('#Username', username);
    await page.fill('#Password', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    await page.goto('https://therightpeople.dk/datamanager.aspx#/companyinfo', { waitUntil: 'networkidle' });

    const inputs = page.locator('input[placeholder="Eks. Danfoss A/S"]');
    const count = await inputs.count();
    let targetInput = null;
    for (let i = 0; i < count; i++) {
      const el = inputs.nth(i);
      if (await el.isVisible()) {
        targetInput = el;
        break;
      }
    }

    if (!targetInput) throw new Error('Visible input for company not found.');
    await targetInput.fill(company);

    const searchButtons = page.locator('#search');
    const btnCount = await searchButtons.count();
    let visibleBtn = null;
    for (let i = 0; i < btnCount; i++) {
      const btn = searchButtons.nth(i);
      if (await btn.isVisible()) {
        visibleBtn = btn;
        break;
      }
    }

    if (!visibleBtn) throw new Error('Visible search button not found.');
    await visibleBtn.click();

    await page.waitForTimeout(4000);

    const allTexts = await page.locator('.ng-binding').allTextContents();
    const cvr = allTexts.map(t => t.match(/\b\d{8}\b/)?.[0]).find(Boolean) || 'CVR not found';

    return { CompanyName: company, 'Company CVR': cvr };
  } catch (err) {
    await page.screenshot({ path: 'cvr-error.png', fullPage: true });
    throw err;
  } finally {
    await browser.close();
  }
};
