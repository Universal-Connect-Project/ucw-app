import {
  MEMBER_CONNECTED_EVENT_TYPE,
  makeAnMXConnection
  searchByText,
  verifyAccountsAndReturnAccountId,
  visitAgg,
  visitWithPostMessageSpy,
} from "@repo/utils-cypress";
import { ComboJobTypes } from "@repo/utils";

describe("mx aggregator using axios proxy", () => {
  it("gets data through the proxy server", () => {
    let memberGuid: string;
    let aggregator: string;
    const shouldTestVcEndpoint = false;
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
    )
      .then(() => makeAnMXConnection())
      .then(() => {
        // Capture postmessages into variables
        cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
          const connection = (mySpy as any)
            .getCalls()
            .find((call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE);
          const { metadata } = connection?.args[0];
          memberGuid = metadata.member_guid;
          aggregator = metadata.aggregator;

          verifyAccountsAndReturnAccountId({
            memberGuid,
            aggregator,
            shouldTestVcEndpoint,
            transactionsAccountSelector: undefined,
            userId,
          });
        });
      });
  });

  it("gets institution credentials from Prod institution through the proxy server", () => {
    const userId = Cypress.env("userId");

    visitAgg({ userId });
    searchByText("Capital One");

    cy.findByLabelText("Add account with Capital One").first().click();
    cy.findByText("Log in at Capital One").should("exist");
  });
});
