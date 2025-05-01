import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

let authorizeTab;

test("connects to Finbank Profiles A and gets expected data", async ({
  page,
}) => {
  test.setTimeout(300000);

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

  await page.getByPlaceholder("Search").fill("finbank");

  await page.getByLabel("Add account with FinBank Profiles - A").click();

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  authorizeTab = await popupPromise;

  await authorizeTab.getByRole("button", { name: "Next" }).click();
  await authorizeTab.getByLabel("Banking Userid").fill("sue_wealthy");
  await authorizeTab.getByLabel("Banking Password").fill("profile_700");

  await authorizeTab.getByLabel("Submit").click();

  const apiRequest = page.context().request;

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 120000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.on("console", async (msg: any) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        console.log("member connected", obj);
        clearTimeout(timer);
        expect(obj.metadata.user_guid).not.toBeNull();
        expect(obj.metadata.member_guid).not.toBeNull();
        expect(obj.metadata.aggregator).toEqual("finicity_sandbox");
        expect(obj.metadata.connectionId).not.toBeNull();

        const { connectionId, user_guid, aggregator } = obj.metadata;

        await testDataEndpoints(
          apiRequest,
          user_guid,
          connectionId,
          aggregator,
        );

        resolve("");
      }
    });
  });

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });

  await expect(true).toBeTruthy();

  await connectedPromise;

  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/finicity_sandbox/user/${userId}`,
  );
});

async function testDataEndpoints(request, userId, connectionId, aggregator) {
  let accountId;
  let url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${connectionId}/accounts`;

  await request.get(url).then(async (response) => {
    const text = await response.text();
    const accounts = JSON.parse(text);
    expect(accounts?.accounts?.length).toBeGreaterThanOrEqual(1);
    const account = accounts.accounts[6]; // This is a deposit account
    accountId = account["depositAccount"].accountId;

    expect(account).toEqual(
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
  });

  expect(accountId).not.toBeNull();
  url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${connectionId}/identity`;

  await request.get(url).then(async (response) => {
    const text = await response.text();
    const customers = JSON.parse(text);
    console.log(customers);
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
  });

  url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions`;

  await request.get(url).then(async (response) => {
    const text = await response.text();
    const transactions = JSON.parse(text);

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
  });
}
