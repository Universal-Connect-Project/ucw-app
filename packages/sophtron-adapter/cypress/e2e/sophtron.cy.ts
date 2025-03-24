import { ComboJobTypes } from "@repo/utils";
import {
  generateDataTests,
  visitAgg,
  expectConnectionSuccess,
  clickContinue,
  searchByText,
  refreshAConnection,
} from "@repo/utils-dev-dependency";
import {
  enterSophtronCredentials,
  searchAndSelectSophtron,
  selectSophtronAccount,
} from "../shared/utils/sophtron";

const makeAConnection = async (jobTypes) => {
  searchAndSelectSophtron();
  enterSophtronCredentials();
  clickContinue();

  if (jobTypes.includes(ComboJobTypes.ACCOUNT_NUMBER)) {
    selectSophtronAccount();
    clickContinue();
  }
  expectConnectionSuccess();
};

describe("Sophtron aggregator", () => {
  generateDataTests({
    makeAConnection,
    transactionsAccountSelector: (accounts) =>
      accounts.find(
        (account) => account?.depositAccount?.nickname === "Primary Checking",
      ),
    shouldTestVcEndpoint: true,
    transactionsQueryString: "?start_time=2021/1/1&end_time=2099/12/31",
  });

  it("refreshes a sophtron connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterSophtronCredentials,
      selectInstitution: searchAndSelectSophtron,
    });
  });

  it("Connects to Sophtron Bank with all MFA options", () => {
    visitAgg({});
    searchByText("Sophtron Bank");
    cy.findByLabelText("Add account with Sophtron Bank").first().click();
    cy.findByLabelText("User ID").type("asdfg12X");
    cy.findByLabelText("Password").type("asdfg12X");
    clickContinue();

    cy.findByRole("textbox", {
      name: "Please enter the Captcha code",
      timeout: 45000,
    }).type("asdf");
    clickContinue();

    cy.findByLabelText("What is your favorite color?", { timeout: 45000 }).type(
      "asdf",
    );
    clickContinue();

    cy.findByText("xxx-xxx-1234", { timeout: 45000 }).click();
    clickContinue();

    cy.findByRole("textbox", {
      name: "Please enter the Token",
      timeout: 45000,
    }).type("asdf");
    clickContinue();

    expectConnectionSuccess();
  });
});
