const { chromium } = require('playwright');

/**
 * Scrapes employee information (CXO, Board, Director) from TheRightPeople for a given company CVR.
 * @param {string} username - Login username for TheRightPeople
 * @param {string} password - Login password for TheRightPeople
 * @param {string} cvr - The company's CVR number to search for
 * @returns {Promise<{
 *   CompanyName: string,
 *   'Company CVR': string,
 *   CXO: Array<Object>,
 *   Bestyrelse: Array<Object>,
 *   Director: Array<Object>
 * }>}
 */
module.exports = async function scrapeEmployee(username, password, cvr) {
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

    // Navigate to company info section
    await page.goto('https://therightpeople.dk/datamanager.aspx#/companyinfo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Find visible CVR input
    const cvrInputs = await page.locator('#txtCVR');
    const inputCount = await cvrInputs.count();

    let visibleInput = null;
    for (let i = 0; i < inputCount; i++) {
      const input = cvrInputs.nth(i);
      if (await input.isVisible()) {
        visibleInput = input;
        break;
      }
    }

    if (!visibleInput) throw new Error('#txtCVR input is not visible after timeout.');

    await visibleInput.fill(cvr);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    // Extract company name and CVR
    const companyName = (await page.locator('h2.ng-binding').first().textContent())?.trim() || 'N/A';
    const allTexts = await page.locator('.ng-binding').allTextContents();
    const companyCVR = allTexts.map(text => text.match(/\b\d{8}\b/)?.[0]).find(Boolean) || 'CVR not found';

    // Extract person data from sections
    const extractPeopleFromSection = async (sectionName) => {
      const people = [];
      const section = page.locator(`tbody:has-text("${sectionName}")`);
      const rows = section.locator('tr.ng-scope');
      const count = await rows.count();

      for (let i = 0; i < count; i += 2) {
        const dataRow = rows.nth(i);
        const cols = dataRow.locator('td');

        const position = await cols.nth(0).innerText();
        const firstName = await cols.nth(3).innerText();
        const lastName = await cols.nth(4).innerText();
        const telephone = await cols.nth(5).innerText();
        const mobile = await cols.nth(6).innerText();
        const email = await cols.nth(7).innerText();

        const linkRow = rows.nth(i + 1);
        const links = linkRow.locator('td a');
        const linkCount = await links.count();

        let linkedin = '';
        for (let j = 0; j < linkCount; j++) {
          const href = await links.nth(j).getAttribute('href');
          if (href?.includes('linkedin.com')) {
            linkedin = href;
            break;
          }
        }

        people.push({
          name: `${firstName.trim()} ${lastName.trim()}`,
          position: position.trim(),
          telephone: telephone.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          linkedin,
        });
      }

      return people;
    };

    const CXO = await extractPeopleFromSection('CXO');
    const Bestyrelse = await extractPeopleFromSection('Bestyrelse');
    const Director = await extractPeopleFromSection('Director');

    return {
      CompanyName: companyName,
      'Company CVR': companyCVR,
      CXO,
      Bestyrelse,
      Director
    };
  } catch (error) {
    await page.screenshot({ path: 'employee-error.png', fullPage: true });
    throw new Error(`Scraping failed: ${error.message}`);
  } finally {
    await browser.close();
  }
};
