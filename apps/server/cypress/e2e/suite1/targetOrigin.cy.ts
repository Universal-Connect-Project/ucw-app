import { ComboJobTypes } from "@repo/utils";
import {
  makeAnMXConnection,
  MEMBER_CONNECTED_EVENT_TYPE,
  visitWithPostMessageSpy,
} from "@repo/utils-e2e/cypress";

describe("targetOrigin", () => {
  it("uses the targetOrigin if it's provided", () => {
    const userId = Cypress.env("userId");
    const correctTargetOrigin = "http://localhost:8080";

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&userId=${userId}&targetOrigin=${correctTargetOrigin}`,
    )
      .then(makeAnMXConnection)
      .then(() => {
        // Capture postmessages into variables
        cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
          const connection = (mySpy as any)
            .getCalls()
            .find((call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE);
          const { metadata } = connection?.args[0];
          const targetOrigin = connection?.args[1];

          expect(metadata).to.have.property("connectionId");
          expect(metadata).to.have.property("aggregator");
          expect(targetOrigin).to.equal(correctTargetOrigin);
          expect(correctTargetOrigin).to.equal(window.location.origin);
        });
      });
  });

  it("has an undefined targetOrigin if it's not provided", () => {
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&userId=${userId}`,
    )
      .then(makeAnMXConnection)
      .then(() => {
        // Capture postmessages into variables
        cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
          const connection = (mySpy as any)
            .getCalls()
            .find((call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE);
          const { metadata } = connection?.args[0];
          const { targetOrigin } = connection?.args[1];

          expect(metadata).to.have.property("connectionId");
          expect(metadata).to.have.property("aggregator");
          expect(targetOrigin).to.be.undefined;
        });
      });
  });

  it("verifies postMessage is called with the specified targetOrigin", () => {
    const userId = Cypress.env("userId");
    const wrongTargetOrigin = "https://wrong-origin.example.com";

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&userId=${userId}&targetOrigin=${wrongTargetOrigin}`,
    )
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

  it("logs a security warning when targetOrigin is not defined", () => {
    const userId = Cypress.env("userId");

    cy.visit(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&userId=${userId}`,
      {
        onBeforeLoad(win) {
          cy.stub(win.console, "warn").as("consoleWarn");
          cy.spy(win.parent, "postMessage").as("postMessage");
        },
      },
    )
      .then(makeAnMXConnection)
      .then(() => {
        cy.wait(2000);

        cy.get("@consoleWarn").should(
          "have.been.calledWith",
          Cypress.sinon.match(
            /🚨 SECURITY WARNING.*targetOrigin is not defined/,
          ),
        );
      });
  });
});
