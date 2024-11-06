import { JobTypes } from "../../../src/shared/contract";
import { generateVcDataTests, visitAgg } from "@repo/utils-dev-dependency";
import {
  expectConnectionSuccess,
  clickContinue,
  searchByText,
  refreshAConnection,
} from "@repo/utils-dev-dependency";
import {
  enterSophtronCredentials,
  searchAndSelectSophtron,
  selectSophtronAccount,
} from "../../shared/utils/sophtron";

const makeAConnection = async (jobType) => {
  searchAndSelectSophtron();
  enterSophtronCredentials();
  clickContinue();

  if ([JobTypes.VERIFICATION].includes(jobType)) {
    selectSophtronAccount();
    clickContinue();
  }
  expectConnectionSuccess();
};

describe("Sophtron aggregator", () => {
  it("refreshes a sophtron connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterSophtronCredentials,
      selectInstitution: searchAndSelectSophtron,
    });
  });

  it("Connects to Sophtron Bank with all MFA options", () => {
    visitAgg();
    searchByText("Sophtron Bank");
    cy.findByLabelText("Add account with Sophtron Bank").first().click();
    cy.findByLabelText("User ID").type("asdfg12X");
    cy.findByText("Password").type("asdfg12X");
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

  generateVcDataTests({ makeAConnection });
});
