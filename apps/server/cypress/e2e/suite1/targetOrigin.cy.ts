import { ComboJobTypes } from "@repo/utils";
import {
  makeAnMXConnection,
  MEMBER_CONNECTED_EVENT_TYPE,
  visitWithPostMessageSpy,
} from "@repo/utils-cypress";

describe("targetOrigin", () => {
  it("uses the targetOrigin if it's provided", () => {
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&userId=${userId}&targetOrigin=${window.location.origin}`,
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

          expect(metadata).to.have.property("member_guid");
          expect(metadata).to.have.property("aggregator");
          expect(targetOrigin).to.equal(window.location.origin);
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

          expect(metadata).to.have.property("member_guid");
          expect(metadata).to.have.property("aggregator");
          expect(targetOrigin).to.be.undefined;
        });
      });
  });
});
