import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

const WIDGET_BASE_URL = "http://localhost:8080/widget";

test("connects to plaid test bank with oAuth", async ({ page }) => {
  test.setTimeout(120000);

  const userId = crypto.randomUUID();

  await page.goto(
    `${WIDGET_BASE_URL}?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("Houndstooth Bank");
  await page.getByLabel("Add account with Houndstooth Bank").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  await page.evaluate(`
      window.addEventListener('message', (event) => {
        const message = event.data
        console.log({message})
    })
  `);

  const authorizeTab = await popupPromise;
  const frame = authorizeTab.frameLocator("iframe[title='Plaid Link']") //iframe[title="Plaid Link Open"]
  await frame.getByText("Continue as guest").click();

  await frame.locator("input[id='search-input-input']").fill("Houndstooth Bank");
  await frame.getByLabel("Houndstooth Bank").click();

  await frame.locator("input[type='text']:not([name='query'])").fill("user_good");
  await frame.locator("input[type='password']").fill("pass_good");
  await frame.locator("button[type='submit']").click();

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 12000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.on("console", async (msg: any) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        clearTimeout(timer);
        expect(obj.metadata.user_guid).toEqual(userId);
        expect(obj.metadata.member_guid).not.toBeNull();
        expect(obj.metadata.aggregator).toEqual("plaid_sandbox");
        expect(obj.metadata.plaidAuthCode).not.toBeNull();

        resolve("");
      }
    });
  });

  await frame.getByText("Continue").click();
  await connectedPromise;

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });
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
