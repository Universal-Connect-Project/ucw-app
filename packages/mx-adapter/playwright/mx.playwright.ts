import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

test("connects to mx bank with oAuth", async ({ page }) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  const popupPromise = page.waitForEvent("popup");

  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await authorizeTab.getByRole("button", { name: "Authorize" }).click();
  await expect(
    authorizeTab.getByText("Thank you for completing OAuth"),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});

test("shows an error page if you deny an mx bank oauth connection", async ({
  page,
}) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  const popupPromise = page.waitForEvent("popup");

  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await authorizeTab.getByRole("button", { name: "Deny" }).click();
  await expect(authorizeTab.getByText("Something went wrong")).toBeVisible();

  // When we fix the issue so that we can see an error state we need to check for it here

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});
