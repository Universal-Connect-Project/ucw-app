import { ComboJobTypes } from "@repo/utils";
import {
  createWidgetUrl,
  makeAnMXConnection,
  MEMBER_CONNECTED_EVENT_TYPE,
  visitWithPostMessageSpy,
} from "@repo/utils-e2e/cypress";

describe("targetOrigin", () => {
  it("uses the targetOrigin if it's provided", () => {
    const userId = Cypress.env("userId");
    const correctTargetOrigin = "http://localhost:8080";

    createWidgetUrl({
      jobTypes: ComboJobTypes.ACCOUNT_OWNER,
      userId,
      targetOrigin: correctTargetOrigin,
    }).then((widgetUrl) => {
      visitWithPostMessageSpy(widgetUrl)
        .then(makeAnMXConnection)
        .then(() => {
          // Capture postmessages into variables
          cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
            const connection = (mySpy as any)
              .getCalls()
              .find(
                (call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE,
              );
            const { metadata } = connection?.args[0];
            const targetOrigin = connection?.args[1];

            expect(metadata).to.have.property("connectionId");
            expect(metadata).to.have.property("aggregator");
            expect(targetOrigin).to.equal(correctTargetOrigin);
            expect(correctTargetOrigin).to.equal(window.location.origin);
          });
        });
    });
  });

  it("returns an error when targetOrigin is not provided", () => {
    const userId = Cypress.env("userId");

    cy.request({
      method: "POST",
      url: "/widgetUrl",
      body: {
        jobTypes: ComboJobTypes.ACCOUNT_OWNER,
        userId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body).to.include("&#x22;targetOrigin&#x22; is required");
    });
  });

  it("verifies postMessage is called with the specified targetOrigin", () => {
    const userId = Cypress.env("userId");
    const wrongTargetOrigin = "https://wrong-origin.example.com";

    createWidgetUrl({
      jobTypes: ComboJobTypes.ACCOUNT_OWNER,
      userId,
      targetOrigin: wrongTargetOrigin,
    }).then((widgetUrl) => {
      visitWithPostMessageSpy(widgetUrl)
        .then(makeAnMXConnection)
        .then(() => {
          // Note: Cypress spies intercept at the function call level,
          // so we see the call even though the browser would block delivery
          cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
            const calls = (mySpy as any).getCalls();

            const connectionCall = calls.find(
              (call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE,
            );

            expect(connectionCall).to.exist;

            // Verify the call was made with the specified targetOrigin
            expect(connectionCall.args[1]).to.equal(wrongTargetOrigin);

            cy.window().then((win) => {
              expect(win.location.origin).to.not.equal(wrongTargetOrigin);
            });
          });
        });
    });
  });
});
