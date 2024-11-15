import {
  clickContinue,
  expectConnectionSuccess,
  visitAgg,
} from "@repo/utils-dev-dependency";
import {
  enterTestExampleACredentials,
  searchAndSelectTestExampleA,
} from "../../shared/utils/testExample";

describe("authentication", () => {
  it("fails if not authorized", () => {
    visitAgg({ failOnStatusCode: false });

    cy.findByText("Unauthorized").should("exist");
  });

  it("is able to connect with the token flow", () => {
    const accessToken = Cypress.env("accessToken");

    const userId = crypto.randomUUID();

    cy.request({
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
      url: `/api/token?userId=${userId}`,
    }).then((response) => {
      const token = response.body.token;

      visitAgg({
        userId,
        token,
      });

      searchAndSelectTestExampleA();
      enterTestExampleACredentials();
      clickContinue();
      expectConnectionSuccess();
    });
  });
});
