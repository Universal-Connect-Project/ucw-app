import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

test("displays error page with failed oAuth", async ({ page }, testInfo) => {
  test.setTimeout(40000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("TestExampleFailedOauth Bank");

  await page.getByLabel("Add account with TestExampleFailedOauth Bank").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await expect(authorizeTab.getByText("Something went wrong")).toBeVisible();
});

test("connects to example bank with oAuth", async ({ page }, testInfo) => {
  test.setTimeout(40000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("TestExampleOauth Bank"); //TestExampleOauth Bank

  await page.getByLabel("Add account with TestExampleOauth Bank").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;

  await expect(
    authorizeTab.getByText("Thank you for completing OAuth."),
  ).toBeVisible();
});
