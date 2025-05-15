export const clickContinue = () => {
  cy.findByRole("button", { name: "Continue" }).click();
};

export const expectConnectionSuccess = () => {
  cy.findByText("Done", { timeout: 240000 }).should("exist");
};

export const searchByText = (text) => {
  cy.findByPlaceholderText("Search").type(text);

  cy.findAllByText(/result/).should("exist");
};

export const selectInstitutionByName = (name) => {
  cy.findByLabelText(`Add account with ${name}`).first().click();
};

export const searchAndSelectMx = () => {
  searchByText("MX Bank");
  cy.findByLabelText("Add account with MX Bank").first().click();
};

export const enterMxCredentials = () => {
  cy.findByLabelText("Username").type("mxuser");
  cy.findByLabelText("Password").type("correct");
};

export const makeAnMXConnection = async () => {
  searchAndSelectMx();
  enterMxCredentials();
  clickContinue();
  expectConnectionSuccess();
};
