import {
  expectConnectionSuccess,
  clickContinue,
  searchByText,
  enterSophtronCredentials,
} from "@repo/utils-e2e/cypress";

export const searchAndSelectSophtron = () => {
  searchByText("Sophtron Bank NoMFA");
  cy.findByLabelText("Add account with Sophtron Bank NoMFA").first().click();
};

export const selectSophtronAccount = () => {
  cy.findByText("Primary Checking 1234", { timeout: 45000 }).click();
};

export const connectToSophtron = () => {
  searchAndSelectSophtron();

  enterSophtronCredentials();

  clickContinue();

  expectConnectionSuccess();
};
