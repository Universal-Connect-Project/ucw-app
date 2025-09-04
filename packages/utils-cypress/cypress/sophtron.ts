export const enterSophtronCredentials = () => {
  cy.findByLabelText(/User ID/).type("asdf");
  cy.findByLabelText("Password").type("asdf");
};
