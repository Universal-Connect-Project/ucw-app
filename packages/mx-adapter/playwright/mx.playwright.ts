import { expect, test } from "@playwright/test";
import { ComboJobTypes, SOMETHING_WENT_WRONG_ERROR_TEXT } from "@repo/utils";
import {
  createExpectPerformanceEvent,
  getAccessToken,
} from "@repo/utils-e2e/playwright";
import { MX_BANK_OAUTH_UCP_INSTITUTION_ID } from "../src/testInstitutions";
import { MX_AGGREGATOR_STRING } from "../src";

test("connects to mx bank with oAuth, tracks performance correctly, and does refresh right after", async ({
  page,
  request,
}) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  const accessToken = await getAccessToken(request);

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&targetOrigin=http://localhost:8080`,
  );

  page.evaluate(`
      window.addEventListener('message', (event) => {
        const message = event.data;
        console.log({ message });
      });
    `);

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  let performanceSessionId;

  const urlToIntercept = `http://localhost:8080/institutions/${MX_BANK_OAUTH_UCP_INSTITUTION_ID}`;

  page.on("response", async (response) => {
    if (response.url() === urlToIntercept) {
      performanceSessionId = JSON.parse(
        response?.headers()?.meta,
      )?.performanceSessionId;
    }
  });

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  await page.waitForResponse(urlToIntercept);

  const popupPromise = page.waitForEvent("popup");

  const loginButton = await page.getByRole("link", { name: "Go to log in" });

  const expectPerformanceEvent = createExpectPerformanceEvent({
    accessToken,
    performanceSessionId,
    request,
  });

  await expectPerformanceEvent({
    shouldRecordResult: false,
    institutionId: MX_BANK_OAUTH_UCP_INSTITUTION_ID,
    aggregatorId: MX_AGGREGATOR_STRING,
  });

  await loginButton.click();

  const authorizeTab = await popupPromise;

  await expectPerformanceEvent({
    shouldRecordResult: true,
    institutionId: MX_BANK_OAUTH_UCP_INSTITUTION_ID,
    aggregatorId: MX_AGGREGATOR_STRING,
  });

  await authorizeTab.getByRole("button", { name: "Authorize" }).click();
  await expect(
    authorizeTab.getByText("Thank you for completing OAuth"),
  ).toBeVisible();

  const connectedPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 120000);

    page.on("console", async (msg) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        clearTimeout(timer);
        expect(obj.metadata.user_guid).toBeUndefined();
        expect(obj.metadata.aggregatorUserId).not.toBeNull();
        expect(obj.metadata.connectionId).not.toBeNull();
        expect(obj.metadata.member_guid).toBeUndefined();
        expect(obj.metadata.aggregator).toEqual("mx_int");

        const { connectionId, aggregator, ucpInstitutionId } = obj.metadata;

        await page.goto(
          `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&aggregator=${aggregator}&institutionId=${ucpInstitutionId}&connectionId=${connectionId}&targetOrigin=http://localhost:8080`,
        );

        const popupPromise2 = page.waitForEvent("popup");
        await page.getByRole("link", { name: "Go to log in" }).click();

        const authorizeTab2 = await popupPromise2;
        await authorizeTab2.getByRole("button", { name: "Authorize" }).click();

        await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
          timeout: 120000,
        });

        resolve();
      }
    });
  });

  await connectedPromise;

  const performanceEvent = await expectPerformanceEvent({
    shouldRecordResult: true,
    institutionId: MX_BANK_OAUTH_UCP_INSTITUTION_ID,
    aggregatorId: MX_AGGREGATOR_STRING,
  });

  expect(performanceEvent.successMetric.isSuccess).toBe(true);

  await request.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});

test("results in a successful performance event even if you close the tab", async ({
  page,
  request,
}) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  const accessToken = await getAccessToken(request);

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&targetOrigin=http://localhost:8080`,
  );

  page.evaluate(`
      window.addEventListener('message', (event) => {
        const message = event.data;
        console.log({ message });
      });
    `);

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  let performanceSessionId;

  const urlToIntercept = `http://localhost:8080/institutions/${MX_BANK_OAUTH_UCP_INSTITUTION_ID}`;

  page.on("response", async (response) => {
    if (response.url() === urlToIntercept) {
      performanceSessionId = JSON.parse(
        response?.headers()?.meta,
      )?.performanceSessionId;
    }
  });

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  await page.waitForResponse(urlToIntercept);

  const popupPromise = page.waitForEvent("popup");

  const loginButton = await page.getByRole("link", { name: "Go to log in" });

  const expectPerformanceEvent = createExpectPerformanceEvent({
    accessToken,
    performanceSessionId,
    request,
  });

  await loginButton.click();

  const authorizeTab = await popupPromise;

  await page.close();

  await authorizeTab.getByRole("button", { name: "Authorize" }).click();
  await expect(
    authorizeTab.getByText("Thank you for completing OAuth"),
  ).toBeVisible();

  let retryCount = 0;
  let isSuccess = false;

  while (retryCount < 5) {
    retryCount++;

    await authorizeTab.waitForTimeout(25000);

    const performanceEvent = await expectPerformanceEvent({});

    if (performanceEvent.successMetric.isSuccess) {
      isSuccess = true;
      break;
    }
  }

  expect(isSuccess).toBe(true);

  await request.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});

test("shows an error page if you deny an mx bank oauth connection", async ({
  page,
}) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&targetOrigin=http://localhost:8080`,
  );

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  const popupPromise = page.waitForEvent("popup");

  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await authorizeTab.getByRole("button", { name: "Deny" }).click();
  await expect(
    authorizeTab.getByText(SOMETHING_WENT_WRONG_ERROR_TEXT),
  ).toBeVisible();

  // When we fix the issue so that we can see an error state we need to check for it here

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});
