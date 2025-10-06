import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";
import { testAccountsData } from "./utils";

const WIDGET_BASE_URL = "http://localhost:8080/widget";

test("connects to plaid's First Platypus Bank and gets account numbers", async ({
  page,
  request,
}) => {
  test.setTimeout(300000);

  const userId = crypto.randomUUID();
  let connectionId: string | undefined;

  await page.goto(
    `${WIDGET_BASE_URL}?jobTypes=${ComboJobTypes.ACCOUNT_NUMBER}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("Plaid Bank");

  await page.getByLabel("Add account with Plaid Bank").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

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

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 12000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.on("console", async (msg: any) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        clearTimeout(timer);
        connectionId = obj.metadata.connectionId;

        expect(obj.metadata.user_guid).toEqual(userId);
        expect(obj.metadata.member_guid).toContain("access-sandbox");
        expect(connectionId).toContain("access-sandbox");
        expect(obj.metadata.aggregator).toEqual("plaid_sandbox");

        resolve("");
      }
    });
  });

  await frame.getByText("Continue").click({ timeout: 60000 });
  await frame.getByText("Finish without saving").click({ timeout: 120000 });

  await connectedPromise;
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

  if (connectionId) {
    const endpoint = `http://localhost:8080/api/aggregator/plaid_sandbox/user/${userId}/connection/${connectionId}`;
    const deleteResponse = await request.delete(endpoint);
    expect(deleteResponse.ok()).toBeTruthy();

    const secondDelete = await request.delete(endpoint);
    expect(secondDelete.status()).toBe(400);
  } else {
    throw new Error("connectionId was not set from connectedPromise");
  }
});
