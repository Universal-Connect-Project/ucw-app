import { MX_BANK_UCP_INSTITUTION_ID } from "@repo/mx-adapter/src/testInstitutions";
import { ComboJobTypes } from "@repo/utils";
import {
  clickContinue,
  enterMxCredentials,
  expectConnectionSuccess,
  visitWithPostMessageSpy,
} from "@repo/utils-cypress";

describe("query parameters", () => {
  it("skips straight to the institution if an institutionId is provided in the query parameters, hides the back button, and completes the connection", () => {
    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(
      `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&institutionId=${MX_BANK_UCP_INSTITUTION_ID}&userId=${userId}`,
    ).then(() => {
      enterMxCredentials();

      clickContinue();

      expectConnectionSuccess();
    });
  });
});
