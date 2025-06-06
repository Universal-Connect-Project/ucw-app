import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

test.describe("Finicity Adapter Tests", () => {
  test("Successful connection and data retrieval and then refresh", async ({
    page,
    request,
  }) => {
    test.setTimeout(300000);

    const userId = crypto.randomUUID();

    await page.goto(
      `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
    );

    page.evaluate(`
      window.addEventListener('message', (event) => {
        const message = event.data;
        console.log({ message });
      });
    `);

    await page.getByPlaceholder("Search").fill("finbank");
    await page.getByLabel("Add account with FinBank Profiles - A").click();

    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("link", { name: "Go to log in" }).click();

    const authorizeTab = await popupPromise;

    await authorizeTab.getByRole("button", { name: "Next" }).click();
    await authorizeTab.getByLabel("Banking Userid").fill("sue_wealthy");
    await authorizeTab.getByLabel("Banking Password").fill("profile_700");
    await authorizeTab.getByLabel("Submit").click();

    const msg = await page.waitForEvent("console", {
      timeout: 120_000,
      predicate: async (msg) => {
        try {
          const args = msg.args();
          const obj =
            args && args.length > 0
              ? (await args[0].jsonValue())?.message
              : undefined;
          return obj?.type === "connect/memberConnected";
        } catch {
          return false;
        }
      },
    });

    const obj = (await msg.args()[0].jsonValue())?.message;
    expect(obj.metadata.user_guid).not.toBeNull();
    expect(obj.metadata.member_guid).not.toBeNull();
    expect(obj.metadata.aggregator).toEqual("finicity_sandbox");
    expect(obj.metadata.connectionId).not.toBeNull();

    const { connectionId, user_guid, aggregator, ucpInstitutionId } =
      obj.metadata;

    await testDataEndpoints(request, user_guid, connectionId, aggregator);

    await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
      timeout: 120000,
    });

    await page.goto(
      `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&aggregator=${aggregator}&institutionId=${ucpInstitutionId}&connectionId=${connectionId}`,
    );

    await expect(page.getByText("Log in at FinBank Profiles - A")).toBeVisible({
      timeout: 8000,
    });

    const popupPromise2 = page.waitForEvent("popup");
    await page.getByRole("link", { name: "Go to log in" }).click();

    const authorizeTab2 = await popupPromise2;
    await expect(authorizeTab2.getByText("You're good to go.")).toBeVisible();

    await authorizeTab2.getByLabel("Exit").click();

    authorizeTab2.getByText("Visit Site").click();

    await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
      timeout: 120000,
    });

    await request.delete(
      `http://localhost:8080/api/aggregator/finicity_sandbox/user/${userId}`,
    );
  });

  test("Failed connection", async ({ page, request }) => {
    test.setTimeout(300000);

    const userId = crypto.randomUUID();

    await page.goto(
      `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
    );

    await page.getByPlaceholder("Search").fill("finbank");
    await page.getByLabel("Add account with FinBank Profiles - A").click();

    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("link", { name: "Go to log in" }).click();

    const authorizeTab = await popupPromise;

    expect(authorizeTab.getByRole("button", { name: "Next" })).toBeVisible({
      timeout: 10000,
    });
    await authorizeTab.getByLabel("Exit").click();
    await authorizeTab.getByLabel("Confirm link").click();
    await authorizeTab.getByText("Visit Site").click();

    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 120000,
    });

    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

    await request.delete(
      `http://localhost:8080/api/aggregator/finicity_sandbox/user/${userId}`,
    );
  });

  async function testDataEndpoints(request, userId, connectionId, aggregator) {
    let url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${connectionId}/accounts`;

    const accountsResponse = await request.get(url);
    const accountsJson = await accountsResponse.json();
    expect(accountsJson?.accounts?.length).toBeGreaterThanOrEqual(1);

    const depositAccount = accountsJson.accounts.find(
      (account) => account.depositAccount,
    );
    const accountId = depositAccount["depositAccount"].accountId;

    expect(depositAccount).toEqual(
      expect.objectContaining({
        depositAccount: expect.objectContaining({
          accountId: expect.any(String),
          accountCategory: "DEPOSIT_ACCOUNT",
          accountType: "savings",
          accountNumber: expect.any(String),
          routingTransitNumber: expect.any(String),
          accountNumberDisplay: expect.any(String),
          status: "active",
          currency: expect.objectContaining({
            currencyCode: "USD",
          }),
          balanceType: "ASSET",
          nickname: expect.any(String),
          currentBalance: expect.any(Number),
          balanceAsOf: expect.any(String),
          availableBalance: expect.any(Number),
        }),
      }),
    );

    expect(accountId).not.toBeNull();

    url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${connectionId}/identity`;

    const identityResponse = await request.get(url);
    const customers = await identityResponse.json();
    expect(customers).toEqual(
      expect.objectContaining({
        customers: expect.arrayContaining([
          expect.objectContaining({
            addresses: expect.arrayContaining([
              expect.objectContaining({
                line1: "72 Christie St",
                city: "Salt Lake City",
                state: "Utah",
                postalCode: "84103",
              }),
            ]),
            customerId: expect.any(String),
            name: expect.objectContaining({
              first: "Sue",
              last: "Wealthy",
            }),
            accounts: expect.arrayContaining([
              expect.objectContaining({ accountId: expect.any(String) }),
            ]),
          }),
        ]),
      }),
    );

    const oneMonthAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const todayIso = new Date().toISOString().slice(0, 10);

    for (const dateRangeQueryParams of [
      `?startDate=${oneMonthAgoIso}&endDate=${todayIso}`,
      "",
    ]) {
      url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions${dateRangeQueryParams}`;

      const transactionsResponse = await request.get(url);
      const transactions = await transactionsResponse.json();

      expect(transactions).toEqual(
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              depositTransaction: expect.objectContaining({
                amount: expect.any(Number),
                accountId: expect.any(String),
                transactionId: expect.any(String),
                postedTimestamp: expect.any(String),
                transactionTimestamp: expect.any(String),
                description: expect.any(String),
                debitCreditMemo: expect.any(String),
                memo: expect.any(String),
                category: expect.any(String),
                status: "active",
                payee: expect.any(String),
              }),
            }),
          ]),
        }),
      );
    }
  }
});
