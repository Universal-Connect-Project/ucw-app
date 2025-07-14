import {
  clearSearch,
  searchByText,
  visitAgg,
  visitIdentity,
} from "@repo/utils-cypress";
import { ComboJobTypes } from "@repo/utils";
import { CHASE_BANK_TEST_FILTER_NAME } from "../../../src/testInstitutions/testInstitutions";
import {
  MX_BANK_NAME,
  MX_BANK_ROUTING_NUMBER,
  MX_BANK_TRANSACTIONS_ONLY_NAME,
} from "@repo/mx-adapter/src/testInstitutions";
import { SOPHTRON_BANK_NAME } from "@repo/sophtron-adapter/src/testInstitutions";

const institutionThatIsInFavoritesButDoesntSupportIdentification =
  MX_BANK_TRANSACTIONS_ONLY_NAME;

describe("search", () => {
  it("loads more institutions", () => {
    visitAgg();

    searchByText("test");

    cy.findByText("25 search results");

    cy.findByText("Load more institutions").click();

    cy.findByText("50 search results");

    cy.findAllByText(CHASE_BANK_TEST_FILTER_NAME).should("have.length", 1);
  });

  it("filters recommended institutions by job type", () => {
    visitAgg();

    const institutionThatIsInFavoriteAndSupportsAll = MX_BANK_NAME;

    cy.findByText(
      institutionThatIsInFavoritesButDoesntSupportIdentification,
    ).should("exist");

    cy.visit(
      `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS},${ComboJobTypes.ACCOUNT_NUMBER},${ComboJobTypes.ACCOUNT_OWNER}&userId=${crypto.randomUUID()}`,
    );

    cy.findByText(institutionThatIsInFavoriteAndSupportsAll).should("exist");

    cy.findByText(
      institutionThatIsInFavoritesButDoesntSupportIdentification,
    ).should("not.exist");
  });

  describe("Fuzzy Search: Should be able to find certain banks with keywords and misspellings", () => {
    it("Finds expected banks", () => {
      visitAgg();

      searchByText("soperton");
      cy.findByText(SOPHTRON_BANK_NAME, {
        timeout: 45000,
      }).should("exist");

      cy.findByPlaceholderText("Search").clear().type("gringotts");
      cy.findByText(MX_BANK_NAME, {
        timeout: 45000,
      }).should("exist");
    });

    it("Ranks search results in the best way", () => {
      visitAgg();

      const needMoreThanResultNumber = 4;

      searchByText("sophtron");
      cy.findByText(SOPHTRON_BANK_NAME).should("exist");
      cy.findByText("Soperton").should("exist");
      cy.findAllByTestId(new RegExp("-row")).then((institutions) => {
        expect(institutions.length).to.be.greaterThan(needMoreThanResultNumber);

        const ariaLabel = institutions.eq(0).attr("aria-label");
        expect(ariaLabel).to.eq(`Add account with ${SOPHTRON_BANK_NAME}`);
      });
    });
  });

  describe("Job type influences the returned institutions", () => {
    it(`shows ${institutionThatIsInFavoritesButDoesntSupportIdentification} for agg job type`, () => {
      visitAgg();

      searchByText(institutionThatIsInFavoritesButDoesntSupportIdentification);
      cy.findByText(
        institutionThatIsInFavoritesButDoesntSupportIdentification,
        { timeout: 45000 },
      ).should("exist");
    });

    it(`does not show ${institutionThatIsInFavoritesButDoesntSupportIdentification} for identity job type because that job type is not supported`, () => {
      visitIdentity();

      searchByText("mx bank");
      cy.findByText(MX_BANK_NAME, {
        timeout: 45000,
      }).should("exist");
      cy.findByText(
        institutionThatIsInFavoritesButDoesntSupportIdentification,
      ).should("not.exist");
    });
  });

  describe("Search by routing number", () => {
    it("shows a bank when the routing number is entered into search", () => {
      visitAgg();

      searchByText(MX_BANK_ROUTING_NUMBER);
      cy.findByText(MX_BANK_NAME).should("exist");
    });
  });

  describe("Aggregator override", () => {
    it("hides institutions that are not supported by MX in the recommended institution list when aggregatorOverride is set to MX", () => {
      visitAgg();

      cy.findByText(SOPHTRON_BANK_NAME).should("exist");

      const institutionThatIsInFavoriteAndSupportsAll = MX_BANK_NAME;

      cy.visit(
        `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${crypto.randomUUID()}&aggregatorOverride=mx`,
      );

      cy.findByText(institutionThatIsInFavoriteAndSupportsAll).should("exist");
      cy.findByText(SOPHTRON_BANK_NAME, {
        timeout: 5000,
      }).should("not.exist");
    });

    it("hides search results that aren't supported by MX when aggregatorOverride is set to MX", () => {
      visitAgg();

      searchByText("sophtron");

      cy.findByText(SOPHTRON_BANK_NAME).should("exist");

      cy.visit(
        `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${crypto.randomUUID()}&aggregatorOverride=mx`,
      );

      searchByText(MX_BANK_NAME);
      cy.findByText(MX_BANK_NAME, {
        timeout: 45000,
      }).should("exist");

      clearSearch();

      searchByText("sophtron");

      cy.findByText("Soperton").should("exist");

      cy.findByText(SOPHTRON_BANK_NAME).should("not.exist");
    });
  });
});
