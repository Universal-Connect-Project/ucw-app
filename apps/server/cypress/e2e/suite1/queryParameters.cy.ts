import { ComboJobTypes } from "@repo/utils";
import {
  clickContinue,
  expectConnectionSuccess,
  refreshAConnection,
  visitWithPostMessageSpy,
} from "@repo/utils-dev-dependency";
import {
  enterTestExampleACredentials,
  searchAndSelectTestExampleA,
  selectTestExampleAAccount,
} from "../../shared/utils/testExample";

const TEST_EXAMPLE_A_INSTITUTION_ID = "5e498f60-3496-4299-96ed-f8eb328ae8af";

describe("query parameters", () => {
  it("skips straight to the institution if an institutionId is provided in the query parameters, hides the back button, and completes the connection", () => {
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&institutionId=${TEST_EXAMPLE_A_INSTITUTION_ID}&userId=${userId}`,
    ).then(() => {
      enterTestExampleACredentials();

      clickContinue();

      expectConnectionSuccess();
    });
  });

  it("refreshes a testExampleA connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterTestExampleACredentials,
      selectInstitution: searchAndSelectTestExampleA,
    });
  });

  it("shows single account select if no parameter is passed, and skips single account select if singleAccountSelect=false", () => {
    const userId = Cypress.env("userId");

    cy.visit(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_NUMBER}&userId=${userId}`,
    );

    searchAndSelectTestExampleA();

    enterTestExampleACredentials();

    clickContinue();

    selectTestExampleAAccount();
    clickContinue();

    expectConnectionSuccess();

    cy.visit(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_NUMBER}&userId=${userId}&singleAccountSelect=false`,
    );

    searchAndSelectTestExampleA();

    enterTestExampleACredentials();

    clickContinue();

    expectConnectionSuccess();
  });
});
