import { JobTypes } from "@repo/utils";
import {
  clickContinue,
  expectConnectionSuccess,
  generateDataTests,
  visitWithPostMessageSpy,
} from "@repo/utils-dev-dependency";
import { TEST_EXAMPLE_B_AGGREGATOR_STRING } from "../../../src/test-adapter/constants";
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

const getAccountId = ({ memberGuid, userId }) => {
  const url = `/data/aggregator/${TEST_EXAMPLE_B_AGGREGATOR_STRING}/user/${userId}/connection/${memberGuid}/accounts`;

  return cy.request("get", `/api${url}`).then((dataResponse) => {
    const accountId = dataResponse.body.accounts.find(
      (acc) => Object.keys(acc)[0] === "depositAccount",
    ).depositAccount.accountId;

    return accountId;
  });
};

const verifyTransactionsValidatorSuccess = ({ accountId, userId }) => {
  const url = `/data/aggregator/${TEST_EXAMPLE_B_AGGREGATOR_STRING}/user/${userId}/account/${accountId}/transactions?start_time=2021/1/1`;

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

const verifyTransactionsValidatorError = ({ accountId, userId }) => {
  const url = `/data/aggregator/${TEST_EXAMPLE_B_AGGREGATOR_STRING}/user/${userId}/account/${accountId}/transactions`;

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

describe("testExampleA and B aggregators", () => {
  generateDataTests({
    makeAConnection: makeAnAConnection,
    shouldTestVcEndpoint: true,
  });
  generateDataTests({
    makeAConnection: makeABConnection,
    shouldTestVcEndpoint: true,
    transactionsQueryString: "?start_time=2021/1/1",
  });

  it(`makes a connection with jobType: ${JobTypes.VERIFICATION}, gets the transaction data from the data endpoints, and tests validator`, () => {
    let memberGuid: string;
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(
      `/widget?job_type=${JobTypes.VERIFICATION}&user_id=${userId}`,
    )
      .then(() => makeABConnection(JobTypes.VERIFICATION))
      .then(() => {
        cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
          const connection = (mySpy as any)
            .getCalls()
            .find(
              (call) => call.args[0].type === "vcs/connect/memberConnected",
            );
          const { metadata } = connection?.args[0];
          memberGuid = metadata.member_guid;

          getAccountId({
            memberGuid,
            userId,
          }).then((accountId) => {
            verifyTransactionsValidatorSuccess({
              accountId,
              userId,
            });
            verifyTransactionsValidatorError({
              accountId,
              userId,
            });
          });
        });
      });
  });
});
