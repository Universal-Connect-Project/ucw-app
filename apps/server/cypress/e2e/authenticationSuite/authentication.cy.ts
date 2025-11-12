import {
  clickContinue,
  createWidgetUrl,
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
      url: "/api/data/accounts?aggregator=mx&userId=userId",
      headers: {
        authorization: `Bearer ${widgetDemoAccessToken}`,
        "ucw-connection-id": "connectionId",
      },
    }).then((dataResponse) => {
      expect(dataResponse.status).to.eq(403);
    });
  });

  it("can connect with the token flow and then get data back and delete the user with the right access", () => {
    const widgetDemoAccessToken = Cypress.env(WIDGET_DEMO_ACCESS_TOKEN_ENV);

    const userId = crypto.randomUUID();

    createWidgetUrl({
      userId,
      jobTypes: ComboJobTypes.TRANSACTIONS,
      targetOrigin: "http://localhost:8080",
      authToken: widgetDemoAccessToken,
    }).then((widgetUrl) => {
      visitWithPostMessageSpy(widgetUrl)
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
            const connectionId = metadata.connectionId;
            const aggregator = metadata.aggregator;

            const widgetDemoDataAccessToken = Cypress.env(
              WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
            );

            cy.request({
              failOnStatusCode: false,
              method: "get",
              url: `/api/data/accounts?aggregator=${aggregator}&userId=${userId}`,
              headers: {
                authorization: `Bearer ${widgetDemoDataAccessToken}`,
                "ucw-connection-id": connectionId,
              },
            }).then((dataResponseWithAccess) => {
              expect(dataResponseWithAccess.status).to.eq(200);

              const widgetDemoDeleteUserAccessToken = Cypress.env(
                WIDGET_DEMO_DELETE_USER_ACCESS_TOKEN_ENV,
              );

              cy.request({
                method: "DELETE",
                url: `/api/user?aggregator=${aggregator}&userId=${userId}`,
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
      url: `/api/user?aggregator=mx&userId=${userId}`,
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
      url: `/api/user?aggregator=mx&userId=${userId}`,
      headers: {
        authorization: `Bearer fakeToken`,
      },
    }).then((deleteResponse) => {
      expect(deleteResponse.status).to.eq(401);
    });
  });
});
