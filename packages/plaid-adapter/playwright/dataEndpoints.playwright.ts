import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";
import { createWidgetUrl } from "@repo/utils-e2e/playwright";
import {
  testAccountsData,
  createConnectedPromise,
  testIdentityData,
} from "./utils";

test("connects to plaid's First Platypus Bank and gets account numbers", async ({
  page,
  request,
}) => {
  test.setTimeout(300000);

  const userId = crypto.randomUUID();

  const widgetUrl = await createWidgetUrl(request, {
    jobTypes: ComboJobTypes.ACCOUNT_NUMBER,
    userId,
  });

  await page.goto(widgetUrl);

  await page.getByPlaceholder("Search").fill("Plaid Bank");

  await page.getByLabel("Add account with Plaid Bank").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  const connectedPromise = createConnectedPromise({
    page,
    userId,
    expect,
    timeoutMs: 30000,
  });

  await page.evaluate(`
      window.addEventListener('message', (event) => {
        const message = event.data
        console.log({message})
    })
  `);

  const authorizeTab = await popupPromise;
  const frame = authorizeTab.frameLocator("iframe[title='Plaid Link']");
  await frame.getByText("Continue as guest").click();

  await frame.locator("input[id='search-input-input']").fill("First Platypus");
  await frame.getByLabel("First Platypus Bank").click();
  // have to click again because there are multiple options
  await frame
    .getByRole("button", { name: "First Platypus Bank", exact: true })
    .click();

  await frame
    .locator("input[type='text']:not([name='query'])")
    .fill("user_good");
  await frame.locator("input[type='password']").fill("pass_good");
  await frame.locator("button[type='submit']").click();

  await frame.getByText("Continue").click({ timeout: 60000 });
  await frame.getByText("Finish without saving").click({ timeout: 120000 });

  const connectionId = await connectedPromise;
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });

  await testAccountsData({
    request,
    userId,
    connectionId: connectionId!,
    aggregator: "plaid_sandbox",
    expect,
  });

  await testIdentityData({
    request,
    userId,
    connectionId: connectionId!,
    aggregator: "plaid_sandbox",
    expect,
  });

  if (connectionId) {
    const endpoint = `http://localhost:8080/api/connection?aggregator=plaid_sandbox`;
    const deleteResponse = await request.delete(endpoint, {
      headers: {
        "UCW-Connection-Id": connectionId,
      },
    });
    expect(deleteResponse.ok()).toBeTruthy();

    const secondDelete = await request.delete(endpoint);
    expect(secondDelete.status()).toBe(400);
  } else {
    throw new Error("connectionId was not set from connectedPromise");
  }
});
