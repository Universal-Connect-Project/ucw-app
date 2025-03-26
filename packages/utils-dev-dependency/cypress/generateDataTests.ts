import { ComboJobTypes, decodeVcData } from "@repo/utils";
import { visitWithPostMessageSpy } from "./visit";
import { MEMBER_CONNECTED_EVENT_TYPE } from "./postMessageEvents";

const jobTypesTestMap = [
  { jobTypes: [ComboJobTypes.ACCOUNT_NUMBER] },
  { jobTypes: [ComboJobTypes.ACCOUNT_OWNER], shouldExpectAccountOwners: true },
  {
    jobTypes: [ComboJobTypes.TRANSACTIONS],
    shouldExpectTransactions: true,
  },
  {
    jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
    shouldExpectTransactions: true,
  },
  {
    jobTypes: [
      ComboJobTypes.ACCOUNT_NUMBER,
      ComboJobTypes.ACCOUNT_OWNER,
      ComboJobTypes.TRANSACTIONS,
      ComboJobTypes.TRANSACTION_HISTORY,
    ],
    shouldExpectAccountOwners: true,
    shouldExpectTransactions: true,
  },
];

const decodeVcDataFromResponse = (response) => {
  return decodeVcData(response.body.jwt);
};

export const verifyAccountsAndReturnAccountId = ({
  aggregator,
  memberGuid,
  shouldTestVcEndpoint,
  transactionsAccountSelector,
  userId,
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/connection/${memberGuid}/accounts`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    expect(dataResponse.status).to.equal(200);
    expect(dataResponse.body.accounts.length).to.be.greaterThan(0);

    const accountId = (
      transactionsAccountSelector
        ? transactionsAccountSelector(dataResponse.body.accounts)
        : dataResponse.body.accounts.find(
            (acc) => Object.keys(acc)[0] === "depositAccount",
          )
    ).depositAccount.accountId;

    if (shouldTestVcEndpoint) {
      return cy.request("GET", `/api/vc${url}`).then((vcResponse) => {
        expect(vcResponse.status).to.equal(200);
        expect(vcResponse.body).to.haveOwnProperty("jwt");
        expect(vcResponse.body.jwt).not.to.haveOwnProperty("error");

        const decodedVcData = decodeVcDataFromResponse(vcResponse);
        // Verify the proper VC came back
        expect(decodedVcData.vc.type).to.include("FinancialAccountCredential");
        expect(
          decodedVcData.vc.credentialSubject.accounts.length,
        ).to.be.greaterThan(0);

        return accountId;
      });
    }

    return accountId;
  });
};

const verifyIdentity = ({
  aggregator,
  memberGuid,
  userId,
  shouldExpectAccountOwners,
  shouldTestVcEndpoint,
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/connection/${memberGuid}/identity`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    expect(dataResponse.status).to.equal(200);

    const expectCustomersLength = (customers) => {
      if (shouldExpectAccountOwners) {
        expect(customers.length).to.be.greaterThan(0);
      } else {
        expect(customers.length).to.be.gte(0);
      }
    };

    expectCustomersLength(dataResponse.body.customers);

    if (shouldTestVcEndpoint) {
      cy.request("GET", `/api/vc${url}`).should((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.haveOwnProperty("jwt");
        expect(response.body.jwt).not.to.haveOwnProperty("error");

        const decodedVcData = decodeVcDataFromResponse(response);
        // Verify the proper VC came back
        expect(decodedVcData.vc.type).to.include("FinancialIdentityCredential");
        expectCustomersLength(decodedVcData.vc.credentialSubject.customers);
      });
    }
  });
};

const verifyTransactions = ({
  accountId,
  aggregator,
  shouldExpectTransactions,
  shouldTestVcEndpoint,
  userId,
  transactionsQueryString = "",
}: {
  accountId: string;
  aggregator: string;
  shouldExpectTransactions?: boolean;
  shouldTestVcEndpoint: boolean;
  userId: string;
  transactionsQueryString?: string;
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions${transactionsQueryString}`;

  const expectTransactionsLength = (transactions) => {
    if (shouldExpectTransactions) {
      expect(transactions.length).to.be.greaterThan(0);
    } else {
      expect(transactions.length).to.be.gte(0);
    }
  };

  return cy
    .request({ method: "GET", url: `/api${url}`, timeout: 60000 })
    .then((dataResponse) => {
      expect(dataResponse.status).to.equal(200);
      expectTransactionsLength(dataResponse.body.transactions);

      if (shouldTestVcEndpoint) {
        cy.request({
          method: "GET",
          url: `/api/vc${url}`,
          timeout: 60000,
        }).should((response) => {
          expect(response.status).to.equal(200);
          expect(response.body).to.haveOwnProperty("jwt");
          expect(response.body.jwt).not.to.haveOwnProperty("error");

          const decodedVcData = decodeVcDataFromResponse(response);
          // Verify the proper VC came back
          expect(decodedVcData.vc.type).to.include(
            "FinancialTransactionCredential",
          );
          expectTransactionsLength(
            decodedVcData.vc.credentialSubject.transactions,
          );
        });
      }
    });
};

export const generateDataTests = ({
  makeAConnection,
  shouldTestVcEndpoint,
  transactionsAccountSelector,
  transactionsQueryString = "",
}: {
  makeAConnection: (jobTypes: ComboJobTypes[]) => void;
  shouldTestVcEndpoint: boolean;
  transactionsAccountSelector?: (accounts: any) => any;
  transactionsQueryString?: string;
}) =>
  jobTypesTestMap.map(
    ({ jobTypes, shouldExpectAccountOwners, shouldExpectTransactions }) =>
      it(`makes a connection with jobTypes: ${jobTypes}, gets the accounts, identity, and transaction data from the data${shouldTestVcEndpoint ? " and vc" : ""} endpoints`, () => {
        let memberGuid: string;
        let aggregator: string;
        const userId = Cypress.env("userId");

        visitWithPostMessageSpy(`/widget?jobTypes=${jobTypes}&userId=${userId}`)
          .then(() => makeAConnection(jobTypes))
          .then(() => {
            // Capture postmessages into variables
            cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
              const connection = (mySpy as any)
                .getCalls()
                .find(
                  (call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE,
                );
              const { metadata } = connection?.args[0];
              memberGuid = metadata.member_guid;
              aggregator = metadata.aggregator;

              verifyAccountsAndReturnAccountId({
                transactionsAccountSelector,
                memberGuid,
                aggregator,
                shouldTestVcEndpoint,
                userId,
              }).then((accountId) => {
                verifyIdentity({
                  memberGuid,
                  aggregator,
                  shouldExpectAccountOwners,
                  shouldTestVcEndpoint,
                  userId,
                });

                verifyTransactions({
                  accountId,
                  aggregator,
                  shouldExpectTransactions,
                  shouldTestVcEndpoint,
                  userId,
                  transactionsQueryString,
                });
              });
            });
          });
      }),
  );
