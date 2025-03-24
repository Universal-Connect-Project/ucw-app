import {
  clickContinue,
  expectConnectionSuccess,
  searchByText,
} from "@repo/utils-dev-dependency";

export const searchAndSelectMx = () => {
  searchByText("MX Bank");
  cy.findByLabelText("Add account with MX Bank").first().click();
};

export const enterMxCredentials = () => {
  cy.findByLabelText("Username").type("mxuser");
  cy.findByLabelText("Password").type("correct");
};

export const makeAConnection = async () => {
  searchAndSelectMx();
  enterMxCredentials();
  clickContinue();
  expectConnectionSuccess();
};
