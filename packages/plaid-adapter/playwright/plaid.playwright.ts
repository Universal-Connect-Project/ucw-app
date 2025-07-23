import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

const PLAID_ITEM_DELETED_ERROR_MSG =
  "The Item you requested cannot be found. This Item does not exist, has been previously removed via /item/remove, or has had access removed by the user.";
const WIDGET_BASE_URL = "http://localhost:8080/widget";

test("connects to plaid test bank with oAuth and deletes connection at end", async ({
  page,
  request,
}) => {
  test.setTimeout(300000);

  const userId = crypto.randomUUID();
  let connectionId: string | undefined;

  await page.goto(
    `${WIDGET_BASE_URL}?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
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

  await frame
    .locator("input[id='search-input-input']")
    .fill("Houndstooth Bank");
  await frame.getByLabel("Houndstooth Bank").click();

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

  await frame.getByText("Continue").click();
  await connectedPromise;
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });

  if (connectionId) {
    const endpoint = `http://localhost:8080/api/aggregator/plaid_sandbox/user/${userId}/connection/${connectionId}`;
    const deleteResponse = await request.delete(endpoint);
    expect(deleteResponse.ok()).toBeTruthy();

    const secondDelete = await request.delete(endpoint);
    const errorBody = await secondDelete.json();
    expect(secondDelete.status()).toBe(400);
    expect(errorBody.message).toBe(PLAID_ITEM_DELETED_ERROR_MSG);
  } else {
    throw new Error("connectionId was not set from connectedPromise");
  }
});

test("should return 400 with error message when requesting plaid data", async ({
  request,
}) => {
  const response = await request.get(
    "http://localhost:8080/api/data/aggregator/plaid/user/USR-234/account/abcd/transactions",
  );

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body).toEqual({
    message: "Data adapter not implemented for Plaid",
  });
});
