import {
  createWidgetUrl,
  MEMBER_CONNECTED_EVENT_TYPE,
  makeAnMXConnection,
  searchByText,
  verifyAccountsAndReturnAccountId,
  visitAgg,
  visitWithPostMessageSpy,
} from "@repo/utils-e2e/cypress";
import { ComboJobTypes } from "@repo/utils";

describe("mx aggregator using axios proxy", () => {
  it("gets data through the proxy server", () => {
    let connectionId: string;
    let aggregator: string;
    const shouldTestVcEndpoint = false;
    const userId = Cypress.env("userId");

    createWidgetUrl({
      jobTypes: ComboJobTypes.TRANSACTIONS,
      userId,
      targetOrigin: "http://localhost:8080",
    }).then((widgetUrl) => {
      visitWithPostMessageSpy(widgetUrl)
        .then(() => makeAnMXConnection())
        .then(() => {
          // Capture postmessages into variables
          cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
            const connection = (mySpy as any)
              .getCalls()
              .find(
                (call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE,
              );
            const { metadata } = connection?.args[0];
            connectionId = metadata.connectionId;
            aggregator = metadata.aggregator;

            verifyAccountsAndReturnAccountId({
              connectionId,
              aggregator,
              shouldTestVcEndpoint,
              transactionsAccountSelector: undefined,
              userId,
            });
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
