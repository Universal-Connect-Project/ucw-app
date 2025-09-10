import {
  clickContinue,
  enterMxCredentials,
  expectConnectionSuccess,
  MEMBER_CONNECTED_EVENT_TYPE,
  searchAndSelectMx,
  visitAgg,
  visitWithPostMessageSpy,
} from "@repo/utils-e2e/cypress";
import {
  WIDGET_DEMO_ACCESS_TOKEN_ENV,
  WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
  WIDGET_DEMO_DELETE_USER_ACCESS_TOKEN_ENV,
} from "../../shared/constants/accessToken";
import { ComboJobTypes } from "@repo/utils";

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
      url: "/api/data/aggregator/mx/user/userId/connection/connectionId/accounts",
      headers: {
        authorization: `Bearer ${widgetDemoAccessToken}`,
      },
    }).then((dataResponse) => {
      expect(dataResponse.status).to.eq(403);
    });
  });

  it("can connect with the token flow and then get data back and delete the user with the right access", () => {
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

      visitWithPostMessageSpy(
        `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
      )
        .then(() => {
          searchAndSelectMx();
          enterMxCredentials();
          clickContinue();
          expectConnectionSuccess();
        })
        .then(() => {
          // Capture postmessages into variables
          cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
            const connection = (mySpy as any)
              .getCalls()
              .find(
                (call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE,
              );
            const { metadata } = connection?.args[0];
            const connectionId = metadata.member_guid;
            const aggregator = metadata.aggregator;

            const widgetDemoDataAccessToken = Cypress.env(
              WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
            );

            cy.request({
              failOnStatusCode: false,
              method: "get",
              url: `/api/data/aggregator/${aggregator}/user/${userId}/connection/${connectionId}/accounts`,
              headers: {
                authorization: `Bearer ${widgetDemoDataAccessToken}`,
              },
            }).then((dataResponseWithAccess) => {
              expect(dataResponseWithAccess.status).to.eq(200);

              const widgetDemoDeleteUserAccessToken = Cypress.env(
                WIDGET_DEMO_DELETE_USER_ACCESS_TOKEN_ENV,
              );

              cy.request({
                method: "DELETE",
                url: `/api/aggregator/${aggregator}/user/${userId}`,
                headers: {
                  authorization: `Bearer ${widgetDemoDeleteUserAccessToken}`,
                },
              }).then((deleteResponseWithAccess) => {
                expect(deleteResponseWithAccess.status).to.eq(204);
              });
            });
          });
        });
    });
  });

  it("can't access the delete user endpoints without the right access", () => {
    const widgetDemoAccessToken = Cypress.env(WIDGET_DEMO_ACCESS_TOKEN_ENV);
    const userId = crypto.randomUUID();

    cy.request({
      failOnStatusCode: false,
      method: "DELETE",
      url: `/api/aggregator/mx/user/${userId}`,
      headers: {
        authorization: `Bearer ${widgetDemoAccessToken}`,
      },
    }).then((deleteResponse) => {
      expect(deleteResponse.status).to.eq(403);
    });
  });

  it("can't access the delete user endpoints without any access", () => {
    const userId = crypto.randomUUID();

    cy.request({
      failOnStatusCode: false,
      method: "DELETE",
      url: `/api/aggregator/mx/user/${userId}`,
      headers: {
        authorization: `Bearer fakeToken`,
      },
    }).then((deleteResponse) => {
      expect(deleteResponse.status).to.eq(401);
    });
  });
});
