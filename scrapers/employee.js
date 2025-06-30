const { chromium } = require('playwright');

module.exports = async function scrapeEmployee(username, password, cvr) {
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

    await page.waitForTimeout(5000);
    const cvrInputs = page.locator('#txtCVR');
    const inputCount = await cvrInputs.count();
    let visibleCVRInput = null;

    for (let i = 0; i < inputCount; i++) {
      const el = cvrInputs.nth(i);
      if (await el.isVisible()) {
        visibleCVRInput = el;
        break;
      }
    }

    if (!visibleCVRInput) throw new Error('#txtCVR input is not visible after waiting.');
    await visibleCVRInput.fill(cvr);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    const companyName = await page.locator('h2.ng-binding').first().textContent();
    const allTexts = await page.locator('.ng-binding').allTextContents();
    const companyCVR = allTexts.map(t => t.match(/\b\d{8}\b/)?.[0]).find(Boolean) || 'CVR not found';

    const extractPeopleFromSection = async (sectionName) => {
      const people = [];
      const sectionTbody = page.locator(`tbody:has-text("${sectionName}")`);
      const personRows = sectionTbody.locator('tr.ng-scope');
      const rowCount = await personRows.count();

      for (let i = 0; i < rowCount; i += 2) {
        const row = personRows.nth(i);
        const cols = row.locator('td');
        const position = await cols.nth(0).innerText();
        const firstName = await cols.nth(3).innerText();
        const lastName = await cols.nth(4).innerText();
        const telephone = await cols.nth(5).innerText();
        const mobile = await cols.nth(6).innerText();
        const email = await cols.nth(7).innerText();

        const linkRow = personRows.nth(i + 1);
        const linkCols = linkRow.locator('td a');
        let linkedin = '';
        const linkCount = await linkCols.count();
        for (let j = 0; j < linkCount; j++) {
          const link = linkCols.nth(j);
          const href = await link.getAttribute('href');
          if (href?.includes('linkedin.com')) {
            linkedin = href;
            break;
          }
        }

        people.push({
          name: `${firstName} ${lastName}`,
          position: position.trim(),
          telephone: telephone.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          linkedin,
        });
      }

      return people;
    };

    const cxoPeople = await extractPeopleFromSection('CXO');
    const boardPeople = await extractPeopleFromSection('Bestyrelse');
    const directorPeople = await extractPeopleFromSection('Director');

    return {
      CompanyName: companyName?.trim(),
      'Company CVR': companyCVR,
      CXO: cxoPeople,
      Bestyrelse: boardPeople,
      Director: directorPeople
    };
  } catch (err) {
    await page.screenshot({ path: 'employee-error.png', fullPage: true });
    throw err;
  } finally {
    await browser.close();
  }
};
