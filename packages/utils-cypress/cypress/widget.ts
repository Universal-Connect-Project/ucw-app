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

export const clearSearch = () => {
  cy.findByPlaceholderText("Search").clear();
};

export const selectInstitutionByName = (name) => {
  cy.findByLabelText(`Add account with ${name}`).first().click();
};
