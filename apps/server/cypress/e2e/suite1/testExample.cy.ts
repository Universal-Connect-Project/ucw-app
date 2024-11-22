import { JobTypes } from "@repo/utils";
import {
  clickContinue,
  expectConnectionSuccess,
  generateDataTests,
  visitWithPostMessageSpy,
} from "@repo/utils-dev-dependency";
import { TEST_EXAMPLE_B_AGGREGATOR_STRING } from "../../../src/test-adapter";
import {
  enterTestExampleACredentials,
  enterTestExampleBCredentials,
  searchAndSelectTestExampleA,
  searchAndSelectTestExampleB,
  selectTestExampleAAccount,
} from "../../shared/utils/testExample";

const makeAnAConnection = async (jobType) => {
  searchAndSelectTestExampleA();
  enterTestExampleACredentials();
  clickContinue();

  if ([JobTypes.VERIFICATION, JobTypes.ALL].includes(jobType)) {
    selectTestExampleAAccount();
    clickContinue();
  }

  expectConnectionSuccess();
};

const makeABConnection = async (jobType) => {
  searchAndSelectTestExampleB();
  enterTestExampleBCredentials();
  clickContinue();

  if ([JobTypes.VERIFICATION, JobTypes.ALL].includes(jobType)) {
    selectTestExampleAAccount();
    clickContinue();
  }

  expectConnectionSuccess();
};

const getAccountId = ({ aggregator, memberGuid, userId }) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/connection/${memberGuid}/accounts`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    const accountId = dataResponse.body.accounts.find(
      (acc) => Object.keys(acc)[0] === "depositAccount",
    ).depositAccount.accountId;

    return accountId;
  });
};

const verifyTransactionsValidatorSuccess = ({
  accountId,
  aggregator,
  userId,
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions${aggregator === TEST_EXAMPLE_B_AGGREGATOR_STRING ? "?start_time=2021/1/1" : ""}`;

  return cy
    .request({
      method: "GET",
      url: `/api${url}`,
    })
    .then((dataResponse) => {
      expect(dataResponse.status).to.equal(200);
      expect(dataResponse.body.transactions.length).to.be.greaterThan(-1);
    });
};

const verifyTransactionsValidatorError = ({
  accountId,
  aggregator,
  userId,
}) => {
  const url = `/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions`;

  return cy
    .request({
      method: "GET",
      url: `/api${url}`,
      failOnStatusCode: false,
    })
    .then((dataResponse) => {
      expect(dataResponse.status).to.equal(400);
    });
};

export const generateValidatorTests = ({ makeAConnection }) => {
  const jobType = JobTypes.VERIFICATION;

  it(`makes a connection with jobType: ${jobType}, gets the transaction data from the data endpoints, and tests validator`, () => {
    let memberGuid: string;
    let aggregator: string;
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(`/?job_type=${jobType}&user_id=${userId}`)
      .then(() => makeAConnection(jobType))
      .then(() => {
        cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
          const connection = (mySpy as any)
            .getCalls()
            .find(
              (call) => call.args[0].type === "vcs/connect/memberConnected",
            );
          const { metadata } = connection?.args[0];
          memberGuid = metadata.member_guid;
          aggregator = metadata.aggregator;

          getAccountId({
            memberGuid,
            aggregator,
            userId,
          }).then((accountId) => {
            verifyTransactionsValidatorSuccess({
              accountId,
              aggregator,
              userId,
            });
            verifyTransactionsValidatorError({
              accountId,
              aggregator,
              userId,
            });
          });
        });
      });
  });
};

describe("testExampleA and B aggregators", () => {
  generateDataTests({
    makeAConnection: makeAnAConnection,
    shouldTestVcEndpoint: true,
  });
  generateDataTests({
    makeAConnection: makeABConnection,
    shouldTestVcEndpoint: true,
  });
  generateValidatorTests({
    makeAConnection: makeABConnection,
  });
});
