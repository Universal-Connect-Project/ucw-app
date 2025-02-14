import { expect, test } from "@playwright/test";

test("displays error page with failed oAuth", async ({ page }, testInfo) => {
  test.setTimeout(40000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?job_type=aggregate&user_id=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("TestExampleFailedOauth Bank");

  await page.getByLabel("Add account with TestExampleFailedOauth Bank").click();
  
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Continue" }).click();

  const authorizeTab = await popupPromise;
  const url = await authorizeTab.url()
  console.log('popup => ' + url);
  await expect(
    authorizeTab.getByText("Something went wrong"),
  ).toBeVisible();

});

test("connects to example bank with oAuth", async ({ page }, testInfo) => {
  test.setTimeout(40000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?job_type=aggregate&user_id=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("TestExampleOauth Bank"); //TestExampleOauth Bank

  await page.getByLabel("Add account with TestExampleOauth Bank").click();
  
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Continue" }).click();

  const authorizeTab = await popupPromise;
  const url = await authorizeTab.url()
  console.log('popup => ' + url);

  await expect(
    authorizeTab.getByText("Thank you for completing OAuth."),
  ).toBeVisible();

});
