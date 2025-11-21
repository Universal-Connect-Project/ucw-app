import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";
import { makeAConnection, testDataEndpoints } from "./utils";

test("connects to plaid's First Platypus Bank and gets data", async ({
  page,
  request,
}) => {
  test.setTimeout(300000);

  const userId = crypto.randomUUID();

  const { connectionId, aggregator } = await makeAConnection({
    jobTypes: [
      ComboJobTypes.ACCOUNT_NUMBER,
      ComboJobTypes.ACCOUNT_OWNER,
      ComboJobTypes.TRANSACTIONS,
    ],
    page,
    userId,
    request,
    expect,
    institutionSearchText: "Plaid Bank",
    institutionName: "First Platypus Bank",
  });

  await testDataEndpoints({
    request,
    userId,
    connectionId,
    aggregator,
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
