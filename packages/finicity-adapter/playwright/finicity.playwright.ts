import { expect, test } from "@playwright/test";

test("connects to finbank bank with oAuth", async ({ page }) => {
  // test.setTimeout(240000);

  // const userId = crypto.randomUUID();

  // await page.goto(
  //   `http://localhost:8080/widget?job_type=aggregate&user_id=${userId}`,
  // );

  // await page.getByPlaceholder("Search").fill("finbank");

  // await page.getByLabel("Add account with finbank").click();

  // const popupPromise = page.waitForEvent("popup");
  // await page.getByRole("link", { name: "Continue" }).click();

  // const authorizeTab = await popupPromise;

  // //to be implememented, below code is copied from akoya, as finicity is not testable yet

  // await authorizeTab.getByLabel("Continue button").click();

  // await authorizeTab.locator("input[type='text']").fill('demo');
  // await authorizeTab.locator("input[type='password']").fill('go');
  // await authorizeTab.locator("button.sign-in").click();

  // await expect(
  //   authorizeTab.locator("div.terms-disclaimer"),
  // ).toBeVisible();

  // await authorizeTab.locator("button[value='#accounts']" ).click();

  // await expect(
  //   authorizeTab.locator("button[id='accounts-approve']"),
  // ).toBeVisible();

    
  // await authorizeTab.locator("label.form-check-label").last().click();
  // await authorizeTab.locator("button[id='accounts-approve']").click();

  // await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
  //   timeout: 120000,
  // });

  // const apiRequest = page.context().request;
  // await apiRequest.delete(
  //   `http://localhost:8080/api/aggregator/finicity_sandbox/user/${userId}`,
  // );
});
