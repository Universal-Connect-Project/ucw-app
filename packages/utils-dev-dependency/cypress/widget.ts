export const clickContinue = () => {
  cy.findByRole("button", { name: "Continue" }).click();
};

export const expectConnectionSuccess = () => {
  cy.findByText("Connected", { timeout: 240000 }).should("exist");
};

export const searchByText = (text) => {
  cy.findByPlaceholderText("Search").type(text);

  cy.findAllByText(/result/).should("exist");
};

export const selectInstitutionByName = (name) => {
  cy.findByLabelText(`Add account with ${name}`).first().click();
};
