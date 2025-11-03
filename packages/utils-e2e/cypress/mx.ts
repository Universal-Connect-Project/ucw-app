import { clickContinue, expectConnectionSuccess, searchByText } from "./widget";

export const searchAndSelectMx = () => {
  searchByText("MX Bank");
  cy.findByLabelText("Add account with MX Bank").first().click();
};

export const enterMxCredentials = () => {
  cy.findByLabelText(/Username/).type("mxuser");
  cy.findByLabelText("Password").type("correct");
};

export const makeAnMXConnection = async () => {
  searchAndSelectMx();
  enterMxCredentials();
  clickContinue();
  expectConnectionSuccess();
};

export const deleteMxUser = (requestProps?: object) => {
  const userId = Cypress.env("userId");

  cy.request({
    method: "DELETE",
    url: `/api/user?aggregator=mx_int&userId=${userId}`,
    failOnStatusCode: false,
    ...requestProps,
  }).should((response) => {
    expect(response.status).to.be.oneOf([200, 204, 400, 404, 403]);
  });
};
