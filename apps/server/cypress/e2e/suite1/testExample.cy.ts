import { JobTypes } from "@repo/utils";
import {
  clickContinue,
  expectConnectionSuccess,
  generateDataTests,
} from "@repo/utils-dev-dependency";
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

describe("testExampleA and B aggregators", () => {
  generateDataTests({
    makeAConnection: makeAnAConnection,
    shouldTestVcEndpoint: true,
  });
  generateDataTests({
    makeAConnection: makeABConnection,
    shouldTestVcEndpoint: true,
  });
});
