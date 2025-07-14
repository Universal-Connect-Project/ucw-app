import { MX_BANK_NAME, MX_BANK_UCP_INSTITUTION_ID } from "@repo/mx-adapter";
import { SOPHTRON_BANK_NAME } from "@repo/sophtron-adapter/src/testInstitutions";
import { ComboJobTypes } from "@repo/utils";
import {
  clearSearch,
  clickContinue,
  enterMxCredentials,
  enterSophtronCredentials,
  expectConnectionSuccess,
  searchByText,
  visitAgg,
  visitWithPostMessageSpy,
} from "@repo/utils-cypress";
import { MX_AND_SOPHTRON_TEST_INSTITUTION_NAME } from "../../../src/testInstitutions/consts";

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

  describe("aggregatorOverride", () => {
    it("hides institutions that are not supported by MX in the recommended institution list when aggregatorOverride is set to MX", () => {
      visitAgg();

      cy.findByText(SOPHTRON_BANK_NAME).should("exist");

      const institutionThatIsInFavoriteAndSupportsAll = MX_BANK_NAME;

      visitAgg({ aggregatorOverride: "mx" });

      cy.findByText(institutionThatIsInFavoriteAndSupportsAll).should("exist");
      cy.findByText(SOPHTRON_BANK_NAME, {
        timeout: 5000,
      }).should("not.exist");
    });

    it("hides search results that aren't supported by MX when aggregatorOverride is set to MX", () => {
      visitAgg();

      searchByText("sophtron");

      cy.findByText(SOPHTRON_BANK_NAME).should("exist");

      visitAgg({ aggregatorOverride: "mx" });

      searchByText(MX_BANK_NAME);
      cy.findByText(MX_BANK_NAME, {
        timeout: 45000,
      }).should("exist");

      clearSearch();

      searchByText("sophtron");

      cy.findByText("Soperton").should("exist");

      cy.findByText(SOPHTRON_BANK_NAME).should("not.exist");
    });

    describe("an institution that supports both sophtron and MX", () => {
      it("resolves to MX when aggregatorOverride is set to MX", () => {
        visitAgg({ aggregatorOverride: "mx" });

        searchByText(MX_AND_SOPHTRON_TEST_INSTITUTION_NAME);

        cy.findByText(MX_AND_SOPHTRON_TEST_INSTITUTION_NAME).click();

        enterMxCredentials();

        expectConnectionSuccess();
      });

      it("resolves to sophtron when aggregatorOverride is set to sophtron", () => {
        visitAgg({ aggregatorOverride: "sophtron" });

        searchByText(MX_AND_SOPHTRON_TEST_INSTITUTION_NAME);

        cy.findByText(MX_AND_SOPHTRON_TEST_INSTITUTION_NAME).click();

        enterSophtronCredentials();

        expectConnectionSuccess();
      });
    });
  });
});
