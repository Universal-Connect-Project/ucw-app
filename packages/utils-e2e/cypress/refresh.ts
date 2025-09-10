import { clickContinue, expectConnectionSuccess } from "./widget";
import { visitWithPostMessageSpy } from "./visit";
import { ComboJobTypes } from "@repo/utils/contract";
import { MEMBER_CONNECTED_EVENT_TYPE } from "./postMessageEvents";

export const refreshAConnection = ({ enterCredentials, selectInstitution }) => {
  const userId = Cypress.env("userId");

  visitWithPostMessageSpy(
    `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
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
      const memberGuid = metadata.member_guid;
      const aggregator = metadata.aggregator;
      const ucpInstitutionId = metadata.ucpInstitutionId;

      //Refresh the connection
      cy.visit(
        `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&connectionId=${memberGuid}&aggregator=${aggregator}&userId=${userId}&institutionId=${ucpInstitutionId}`,
      );

      enterCredentials();

      cy.findByRole("button", { name: "Back" }).should("not.exist");

      clickContinue();

      expectConnectionSuccess();
    });
  });
};
