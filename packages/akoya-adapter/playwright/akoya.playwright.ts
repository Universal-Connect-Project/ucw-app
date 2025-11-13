import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";
import { createWidgetUrl } from "@repo/utils-e2e/playwright";

test("connects to mikomo bank with oAuth", async ({ page, request }) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  const widgetUrl = await createWidgetUrl(request, {
    jobTypes: [ComboJobTypes.TRANSACTIONS],
    userId,
    targetOrigin: "http://localhost:8080",
  });

  await page.goto(widgetUrl);

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
        expect(obj.metadata.user_guid).toBeUndefined();
        expect(obj.metadata.aggregatorUserId).toEqual(userId);
        expect(obj.metadata.member_guid).toBeUndefined();
        expect(obj.metadata.connectionId).toEqual("mikomo");
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
    "http://localhost:8080/api/data/transactions?aggregator=akoya&userId=someUserId&accountId=someAccountId",
  );

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body).toEqual({
    message: "Data adapter not implemented for Akoya",
  });
});
