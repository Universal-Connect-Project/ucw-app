import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";
import {
  createExpectPerformanceEvent,
  getAccessToken,
} from "@repo/utils-e2e/playwright";
import { PLAID_AGGREGATOR_STRING, PLAID_BANK_UCP_INSTITUTION_ID } from "../src";
import { createConnectedPromise } from "./utils";
const PLAID_TEST_BANK_HOUNDSTOOTH_INSTITUTION_ID =
  "3d104b00-7f6a-4a7d-bf29-34049214e846";

const PLAID_ITEM_DELETED_ERROR_MSG =
  "The Item you requested cannot be found. This Item does not exist, has been previously removed via /item/remove, or has had access removed by the user.";
const WIDGET_BASE_URL = "http://localhost:8080/widget";

test("connects to plaid test bank through credential flow and deletes connection at end, doesnt record success because initial selection was Plaid Bank and final connection was Houndstooth Bank", async ({
  page,
  request,
}) => {
  test.setTimeout(300000);

  const userId = crypto.randomUUID();

  const accessToken = await getAccessToken(request);

  await page.goto(
    `${WIDGET_BASE_URL}?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("Plaid Bank");

  let performanceSessionId;

  const urlToIntercept = `http://localhost:8080/institutions/${PLAID_BANK_UCP_INSTITUTION_ID}`;

  page.on("response", async (response) => {
    if (response.url() === urlToIntercept) {
      performanceSessionId = JSON.parse(
        response?.headers()?.meta,
      )?.performanceSessionId;
    }
  });

  await page.getByLabel("Add account with Plaid Bank").click();

  await page.waitForResponse(urlToIntercept);

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  const expectPerformanceEvent = createExpectPerformanceEvent({
    accessToken,
    performanceSessionId: performanceSessionId!,
    request,
  });

  // Wait for performance service to process events
  await page.waitForTimeout(3000);

  await expectPerformanceEvent({
    shouldRecordResult: true,
    institutionId: PLAID_BANK_UCP_INSTITUTION_ID,
    aggregatorId: PLAID_AGGREGATOR_STRING,
  });

  const connectedPromise = createConnectedPromise({
    page,
    userId,
    expect,
    timeoutMs: 50000,
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

  await frame
    .locator("input[id='search-input-input']")
    .fill("Houndstooth Bank");
  await frame.getByLabel("Houndstooth Bank").click();

  await frame
    .locator("input[type='text']:not([name='query'])")
    .fill("user_good");
  await frame.locator("input[type='password']").fill("pass_good");
  await frame.locator("button[type='submit']").click();

  await frame.getByText("Continue").click({ timeout: 60000 });
  await expect(frame.getByText("Finish without saving")).toBeEnabled({
    timeout: 120000,
  });
  await frame
    .getByText("Finish without saving", { exact: false })
    .click({ timeout: 10000 });

  const connectionId = await connectedPromise;
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 200000,
  });

  // Wait for performance service to process events
  await page.waitForTimeout(3000);

  const performanceEvent = await expectPerformanceEvent({
    shouldRecordResult: true,
    institutionId: PLAID_BANK_UCP_INSTITUTION_ID,
    aggregatorId: PLAID_AGGREGATOR_STRING,
  });

  expect(performanceEvent.successMetric.isSuccess).toBe(false);

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

test(
  "connects to plaid test bank through credential flow and deletes connection at end, " +
    "records success because initial institution selection was Houndstooth Bank and final connection was Houndstooth Bank. " +
    "Adds additional duration from EVENTS webhook",
  async ({ page, request }) => {
    test.setTimeout(300000);

    const userId = crypto.randomUUID();

    const accessToken = await getAccessToken(request);

    await page.goto(
      `${WIDGET_BASE_URL}?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
    );

    await page.getByPlaceholder("Search").fill("Houndstooth");

    let performanceSessionId;

    const urlToIntercept = `http://localhost:8080/institutions/${PLAID_TEST_BANK_HOUNDSTOOTH_INSTITUTION_ID}`;

    page.on("response", async (response) => {
      if (response.url() === urlToIntercept) {
        performanceSessionId = JSON.parse(
          response?.headers()?.meta,
        )?.performanceSessionId;
      }
    });

    await expect(
      page.getByLabel("Add account with Houndstooth Bank"),
    ).toBeVisible({ timeout: 10000 });
    await page.getByLabel("Add account with Houndstooth Bank").click();

    await page.waitForResponse(urlToIntercept, { timeout: 30000 });

    const popupPromise = page.waitForEvent("popup", { timeout: 30000 });

    await expect(page.getByRole("link", { name: "Go to log in" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("link", { name: "Go to log in" }).click();

    const expectPerformanceEvent = createExpectPerformanceEvent({
      accessToken,
      performanceSessionId: performanceSessionId!,
      request,
    });

    // Wait for performance service to process events
    await page.waitForTimeout(3000);

    const beforeCompletePerformance = await expectPerformanceEvent({
      shouldRecordResult: true,
      institutionId: PLAID_TEST_BANK_HOUNDSTOOTH_INSTITUTION_ID,
      aggregatorId: PLAID_AGGREGATOR_STRING,
    });

    expect(beforeCompletePerformance.durationMetric).toBeUndefined();

    const connectedPromise = createConnectedPromise({
      page,
      userId,
      expect,
      timeoutMs: 50000,
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

    await frame
      .locator("input[id='search-input-input']")
      .fill("Houndstooth Bank");
    await frame.getByLabel("Houndstooth Bank").click();

    await frame
      .locator("input[type='text']:not([name='query'])")
      .fill("user_good");
    await frame.locator("input[type='password']").fill("pass_good");
    await frame.locator("button[type='submit']").click();

    await frame.getByText("Continue").click({ timeout: 60000 });
    await expect(frame.getByText("Finish without saving")).toBeEnabled({
      timeout: 120000,
    });
    await frame
      .getByText("Finish without saving", { exact: false })
      .click({ timeout: 10000 });

    const connectionId = await connectedPromise;
    await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
      timeout: 200000,
    });

    // Wait for performance service to process events
    await page.waitForTimeout(4000);

    const performanceEvent = await expectPerformanceEvent({
      shouldRecordResult: true,
      institutionId: PLAID_TEST_BANK_HOUNDSTOOTH_INSTITUTION_ID,
      aggregatorId: PLAID_AGGREGATOR_STRING,
    });

    expect(performanceEvent.durationMetric.jobDuration).toBeGreaterThan(0);
    expect(performanceEvent.durationMetric.additionalDuration).toBeGreaterThan(
      0,
    );

    expect(performanceEvent.successMetric.isSuccess).toBe(true);

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
  },
);

test("should return 400 with error message when requesting plaid data", async ({
  request,
}) => {
  const response = await request.get(
    "http://localhost:8080/api/data/aggregator/plaid_sandbox/user/USR-234/account/abcd/transactions",
  );

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body).toEqual({
    message: "Transactions data type not implemented yet",
  });
});
