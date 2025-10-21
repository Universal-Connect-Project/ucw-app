import { clickContinue, expectConnectionSuccess } from "./widget";
import { visitWithPostMessageSpy } from "./visit";
import { ComboJobTypes } from "@repo/utils/contract";
import { MEMBER_CONNECTED_EVENT_TYPE } from "./postMessageEvents";

export const refreshAConnection = ({ enterCredentials, selectInstitution }) => {
  const userId = Cypress.env("userId");

  visitWithPostMessageSpy(
    `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&targetOrigin=http://localhost:8080`,
  ).then(() => {
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
      cy.visit(
        `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&connectionId=${connectionId}&aggregator=${aggregator}&userId=${userId}&institutionId=${ucpInstitutionId}&targetOrigin=http://localhost:8080`,
      );

      enterCredentials();

      cy.findByRole("button", { name: "Back" }).should("not.exist");

      clickContinue();

      expectConnectionSuccess();
    });
  });
};
