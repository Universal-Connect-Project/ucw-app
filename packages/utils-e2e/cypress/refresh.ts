import { clickContinue, expectConnectionSuccess } from "./widget";
import { visitWithPostMessageSpy } from "./visit";
import { ComboJobTypes } from "@repo/utils/contract";
import { MEMBER_CONNECTED_EVENT_TYPE } from "./postMessageEvents";
import { createWidgetUrl } from "./createWidgetUrl";

export const refreshAConnection = ({ enterCredentials, selectInstitution }) => {
  const userId = Cypress.env("userId");

  createWidgetUrl({
    jobTypes: ComboJobTypes.TRANSACTIONS,
    userId,
    targetOrigin: "http://localhost:8080",
  }).then((widgetUrl) => {
    visitWithPostMessageSpy(widgetUrl).then(() => {
      // Make the initial connection
      selectInstitution();

      enterCredentials();

      clickContinue();

      expectConnectionSuccess();

      // Capture postmessages into variables
      cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
        const connection = (mySpy as any)
          .getCalls()
          .find((call) => call.args[0].type === MEMBER_CONNECTED_EVENT_TYPE);

        const { metadata } = connection?.args[0];
        const connectionId = metadata.connectionId;
        const aggregator = metadata.aggregator;
        const ucpInstitutionId = metadata.ucpInstitutionId;

        //Refresh the connection
        createWidgetUrl({
          jobTypes: ComboJobTypes.TRANSACTIONS,
          aggregator: aggregator,
          userId: userId,
          institutionId: ucpInstitutionId,
          connectionId: connectionId,
          targetOrigin: "http://localhost:8080",
        }).then((widgetUrl) => {
          cy.visit(widgetUrl);
        });

        enterCredentials();

        cy.findByRole("button", { name: "Back" }).should("not.exist");

        clickContinue();

        expectConnectionSuccess();
      });
    });
  });
};
