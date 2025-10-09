import type { Expect, Page } from "@playwright/test";
import {
  AccountCategory,
  AccountStatus,
  AccountSubType,
  BalanceType,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";

interface TestDataParams {
  request: {
    get: (url: string) => Promise<{ json: () => Promise<unknown> }>;
  };
  userId: string;
  connectionId: string;
  aggregator: string;
  expect: Expect;
}

export async function testAccountsData({
  request,
  userId,
  connectionId,
  aggregator,
  expect,
}: TestDataParams) {
  const url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${connectionId}/accounts`;

  const accountsResponse = await request.get(url);
  const accountsJson = (await accountsResponse.json()) as {
    accounts: { depositAccount?: unknown }[];
  };
  expect(accountsJson?.accounts?.length).toBeGreaterThanOrEqual(1);

  const depositAccount = accountsJson.accounts.find(
    (account) => account.depositAccount,
  );
  const accountId = (
    depositAccount as { depositAccount: { accountId: string } }
  )?.depositAccount?.accountId;

  expect(depositAccount).toEqual(
    expect.objectContaining({
      depositAccount: expect.objectContaining({
        accountId: expect.any(String),
        accountCategory: AccountCategory.DEPOSIT_ACCOUNT,
        accountType: AccountSubType.CHECKING,
        accountNumber: expect.any(String),
        routingTransitNumber: expect.any(String),
        accountNumberDisplay: expect.any(String),
        status: AccountStatus.OPEN,
        currency: expect.objectContaining({
          currencyCode: "USD",
        }),
        balanceType: BalanceType.ASSET,
        nickname: expect.any(String),
        productName: expect.any(String),
        currentBalance: expect.any(Number),
        balanceAsOf: expect.any(String),
        availableBalance: expect.any(Number),
        fiAttributes: expect.arrayContaining([
          expect.objectContaining({
            name: "plaidAccountId",
            value: expect.any(String),
          }),
          expect.objectContaining({
            name: "plaidItemId",
            value: expect.any(String),
          }),
          expect.objectContaining({
            name: "plaidInstitutionId",
            value: expect.any(String),
          }),
          expect.objectContaining({
            name: "plaidInstitutionName",
            value: expect.any(String),
          }),
        ]),
      }),
    }),
  );

  expect(accountId).not.toBeNull();
}

interface CreateConnectedPromiseParams {
  page: Page;
  userId: string;
  expect: Expect;
  timeoutMs?: number;
}

/**
 * Creates a promise that resolves when the Plaid connection is successful
 * and returns the connectionId. Includes proper cleanup and error handling.
 */
export function createConnectedPromise({
  page,
  userId,
  expect,
  timeoutMs = 30000,
}: CreateConnectedPromiseParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(`timed out after ${timeoutMs / 1000} seconds waiting for connected`),
      timeoutMs,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageHandler = async (msg: any) => {
      try {
        const obj = (await msg.args()[0].jsonValue())?.message;
        if (obj?.type === "connect/memberConnected") {
          clearTimeout(timer);
          page.off("console", messageHandler); // Clean up listener
          
          const connectionId = obj.metadata.connectionId;

          expect(obj.metadata.user_guid).toEqual(userId);
          expect(obj.metadata.member_guid).toContain("access-sandbox");
          expect(connectionId).toContain("access-sandbox");
          expect(obj.metadata.aggregator).toEqual("plaid_sandbox");

          resolve(connectionId);
        }
      } catch (error) {
        // Ignore JSON parsing errors for non-relevant console messages
      }
    };

    // Add a small delay before setting up the listener to avoid race conditions
    setTimeout(() => {
      page.on("console", messageHandler);
    }, 100);
  });
}
