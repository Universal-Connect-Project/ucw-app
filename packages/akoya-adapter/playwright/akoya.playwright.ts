import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

test("connects to mikomo bank with oAuth", async ({ page }, testInfo) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
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
  const url = await authorizeTab.url();
  console.log("popup => " + url);
  const screenshotPath = testInfo.outputPath(`popup_login.png`);
  await authorizeTab.screenshot({ path: screenshotPath, timeout: 5000 });
  await authorizeTab.locator("input[type='text']").fill("mikomo_1");
  await authorizeTab.locator("input[type='password']").fill("mikomo_1");
  await authorizeTab.locator("button[type='submit']").click();

  await expect(authorizeTab.locator("div.terms-disclaimer")).toBeVisible();

  await authorizeTab.locator("button[value='#accounts']").click();

  await expect(
    authorizeTab.locator("button[id='accounts-approve']"),
  ).toBeVisible();

  await authorizeTab.locator("label.form-check-label").last().click();
  await authorizeTab.locator("button[id='accounts-approve']").click();

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 12000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.on("console", async (msg: any) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        clearTimeout(timer);
        resolve("");
      }
    });
  });

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });
  await connectedPromise;

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/akoya_sandbox/user/${userId}`,
  );
});

test("should return 400 with error message when requesting akoya data", async ({
  request,
}) => {
  const response = await request.get(
    "http://localhost:8080/api/data/aggregator/akoya/user/USR-234/account/abcd/transactions",
  );

  expect(response.status()).toBe(400);

  const body = await response.text();
  expect(body).toContain("Something went wrong");
});
