import { expect, test } from "@playwright/test";
import * as fs from 'fs';

let authorizeTab;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshotPath = testInfo.outputPath(`failure.png`);
    testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    if(authorizeTab){
      await authorizeTab.screenshot({ path: screenshotPath, timeout: 5000 });
      const html = await authorizeTab.content()
      const htmlPath = testInfo.outputPath(`failure.html`);
      fs.writeFileSync(htmlPath, html);
    }else{
      await page.screenshot({ path: screenshotPath, timeout: 5000 });
    }
  }
});

test("connects to finbank bank with oAuth", async ({ page }) => {
  test.setTimeout(30000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=transactions&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("finbank");

  await page.getByLabel("Add account with FinBank Profiles - A").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  authorizeTab = await popupPromise;

  //to be implememented, below code is copied from akoya, as finicity is not testable yet

  await authorizeTab.getByLabel("Continue button").click();

  await authorizeTab.locator("input[type='text']").fill('demo');
  await authorizeTab.locator("input[type='password']").fill('go');
  await authorizeTab.locator("button.sign-in").click();

  await expect(
    authorizeTab.locator("div.terms-disclaimer"),
  ).toBeVisible();

  await authorizeTab.locator("button[value='#accounts']" ).click();

  await expect(
    authorizeTab.locator("button[id='accounts-approve']"),
  ).toBeVisible();

    
  await authorizeTab.locator("label.form-check-label").last().click();
  await authorizeTab.locator("button[id='accounts-approve']").click();

  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
    timeout: 120000,
  });

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/finicity_sandbox/user/${userId}`,
  );
});
