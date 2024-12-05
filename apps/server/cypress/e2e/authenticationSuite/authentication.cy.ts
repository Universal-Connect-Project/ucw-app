import {
  clickContinue,
  expectConnectionSuccess,
  visitAgg,
} from "@repo/utils-dev-dependency";
import {
  enterTestExampleACredentials,
  searchAndSelectTestExampleA,
} from "../../shared/utils/testExample";
import {
  WIDGET_DEMO_ACCESS_TOKEN_ENV,
  WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
} from "../../shared/constants/accessToken";

describe("authentication", () => {
  it("fails if not authorized to make a connection", () => {
    visitAgg({ failOnStatusCode: false });

    cy.findByText("Unauthorized").should("exist");
  });

  it("can't access the data endpoints without the right access", () => {
    const widgetDemoAccessToken = Cypress.env(WIDGET_DEMO_ACCESS_TOKEN_ENV);

    cy.request({
      failOnStatusCode: false,
      method: "get",
      url: "/api/data/aggregator/testExampleA/user/userId/connection/connectionId/accounts",
      headers: {
        authorization: `Bearer ${widgetDemoAccessToken}`,
      },
    }).then((dataResponse) => {
      expect(dataResponse.status).to.eq(403);
    });
  });

  it("can access the data endpoints with the right access", () => {
    const widgetDemoDataAccessToken = Cypress.env(
      WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
    );

    cy.request({
      failOnStatusCode: false,
      method: "get",
      url: "/api/data/aggregator/testExampleA/user/userId/connection/connectionId/accounts",
      headers: {
        authorization: `Bearer ${widgetDemoDataAccessToken}`,
      },
    }).then((dataResponseWithAccess) => {
      expect(dataResponseWithAccess.status).to.eq(200);
    });
  });

  it("is able to connect with the token flow", () => {
    const widgetDemoAccessToken = Cypress.env(WIDGET_DEMO_ACCESS_TOKEN_ENV);

    const userId = crypto.randomUUID();

    cy.request({
      headers: {
        authorization: `Bearer ${widgetDemoAccessToken}`,
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
