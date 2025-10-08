import type { Expect } from "@playwright/test";
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
