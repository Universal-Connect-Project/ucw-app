import { decodeVcData, JobTypes } from "@repo/utils";
import { visitWithPostMessageSpy } from "./visit";

const jobTypes = Object.values(JobTypes);

const decodeVcDataFromResponse = (response) => {
  return decodeVcData(response.body.jwt);
};

const verifyAccountsAndReturnAccountId = ({
  aggregator,
  memberGuid,
  shouldTestVcEndpoint,
  userId,
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/connection/${memberGuid}/accounts`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    expect(dataResponse.status).to.equal(200);
    expect(dataResponse.body.accounts.length).to.be.greaterThan(0);

    const accountId = dataResponse.body.accounts.find(
      (acc) => Object.keys(acc)[0] === "depositAccount",
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
  shouldTestVcEndpoint,
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/connection/${memberGuid}/identity`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    expect(dataResponse.status).to.equal(200);
    expect(dataResponse.body.customers.length).to.be.gte(0);

    if (shouldTestVcEndpoint) {
      cy.request("GET", `/api/vc${url}`).should((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.haveOwnProperty("jwt");
        expect(response.body.jwt).not.to.haveOwnProperty("error");

        const decodedVcData = decodeVcDataFromResponse(response);
        // Verify the proper VC came back
        expect(decodedVcData.vc.type).to.include("FinancialIdentityCredential");
        expect(decodedVcData.vc.credentialSubject.customers.length).to.be.gte(
          0,
        );
      });
    }
  });
};

const verifyTransactions = ({
  accountId,
  aggregator,
  shouldTestVcEndpoint,
  userId,
  transactionsQueryString = "",
}: {
  accountId: string;
  aggregator: string;
  shouldTestVcEndpoint: boolean;
  userId: string;
  transactionsQueryString?: string;
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions${transactionsQueryString}`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    expect(dataResponse.status).to.equal(200);
    expect(dataResponse.body.transactions.length).to.be.gte(0);

    if (shouldTestVcEndpoint) {
      cy.request("GET", `/api/vc${url}`).should((response) => {
        expect(response.status).to.equal(200);
        expect(response.body).to.haveOwnProperty("jwt");
        expect(response.body.jwt).not.to.haveOwnProperty("error");

        const decodedVcData = decodeVcDataFromResponse(response);
        // Verify the proper VC came back
        expect(decodedVcData.vc.type).to.include(
          "FinancialTransactionCredential",
        );
        expect(
          decodedVcData.vc.credentialSubject.transactions.length,
        ).to.be.gte(0);
      });
    }
  });
};

export const generateDataTests = ({
  makeAConnection,
  shouldTestVcEndpoint,
  transactionsQueryString = "",
}: {
  makeAConnection: (jobType: JobTypes) => void;
  shouldTestVcEndpoint: boolean;
  transactionsQueryString?: string;
}) =>
  jobTypes.map((jobType) =>
    it(`makes a connection with jobType: ${jobType}, gets the accounts, identity, and transaction data from the data${shouldTestVcEndpoint ? " and vc" : ""} endpoints`, () => {
      let memberGuid: string;
      let aggregator: string;
      const userId = Cypress.env("userId");

      visitWithPostMessageSpy(`/widget?job_type=${jobType}&user_id=${userId}`)
        .then(() => makeAConnection(jobType))
        .then(() => {
          // Capture postmessages into variables
          cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
            const connection = (mySpy as any)
              .getCalls()
              .find(
                (call) => call.args[0].type === "vcs/connect/memberConnected",
              );
            const { metadata } = connection?.args[0];
            memberGuid = metadata.member_guid;
            aggregator = metadata.aggregator;

            verifyAccountsAndReturnAccountId({
              memberGuid,
              aggregator,
              shouldTestVcEndpoint,
              userId,
            }).then((accountId) => {
              verifyIdentity({
                memberGuid,
                aggregator,
                shouldTestVcEndpoint,
                userId,
              });

              verifyTransactions({
                accountId,
                aggregator,
                shouldTestVcEndpoint,
                userId,
                transactionsQueryString,
              });
            });
          });
        });
    }),
  );
