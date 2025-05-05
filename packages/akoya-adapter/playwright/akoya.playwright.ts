import { expect, test } from "@playwright/test";
import { ComboJobTypes, SOMETHING_WENT_WRONG_ERROR_TEXT } from "@repo/utils";

const WIDGET_BASE_URL = "http://localhost:8080/widget";

test("connects to mikomo bank with oAuth", async ({ page }) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `${WIDGET_BASE_URL}?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  page.evaluate(`
      window.addEventListener('message', (event) => {
          const message = event.data
          console.log({message})
    })
  `);

  await page.getByPlaceholder("Search").fill("mikomo bank");
  await page.getByLabel("Add account with Mikomo Bank").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await authorizeTab.locator("input[type='text']").fill("mikomo_1");
  await authorizeTab.locator("input[type='password']").fill("mikomo_1");
  await authorizeTab.getByRole("button", { name: "Sign in →" }).click();

  await authorizeTab.getByRole("button", { name: "Next" }).click();

  await authorizeTab.getByText("Individual (*****9276)").click();
  await authorizeTab.getByRole("button", { name: "Approve" }).click();

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 12000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.on("console", async (msg: any) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        clearTimeout(timer);
        expect(obj.metadata.user_guid).toEqual(userId);
        expect(obj.metadata.member_guid).toEqual("mikomo");
        expect(obj.metadata.aggregator).toEqual("akoya_sandbox");
        expect(obj.metadata.akoyaAuthCode).not.toBeNull();

        resolve("");
      }
    });
  });

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });
  await connectedPromise;
});

test("should return 400 with error message when requesting akoya data", async ({
  request,
}) => {
  const response = await request.get(
    "http://localhost:8080/api/data/aggregator/akoya/user/USR-234/account/abcd/transactions",
  );

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body).toEqual({
    message: "Data adapter not implemented for Akoya",
  });
});
