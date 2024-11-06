import { JobTypes } from "../../../src/shared/contract";
import { generateVcDataTests } from "@repo/utils-dev-dependency";
import { enterMxCredentials, searchAndSelectMx } from "../../shared/utils/mx";
import {
  clickContinue,
  expectConnectionSuccess,
  refreshAConnection,
} from "@repo/utils-dev-dependency";

const makeAConnection = async (jobType) => {
  searchAndSelectMx();
  enterMxCredentials();
  clickContinue();

  if ([JobTypes.ALL, JobTypes.VERIFICATION].includes(jobType)) {
    cy.findByText("Checking").click();
    clickContinue();
  }
  expectConnectionSuccess();
};

describe("mx aggregator", () => {
  generateVcDataTests({ makeAConnection });

  it("refreshes an mx connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx,
    });
  });
});
