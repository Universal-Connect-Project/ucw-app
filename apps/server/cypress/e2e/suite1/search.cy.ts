import {
  searchByText,
  visitAgg,
  visitIdentity,
} from "@repo/utils-dev-dependency";
import {
  TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME,
  TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME,
} from "../../shared/constants/testExample";

const institutionThatIsInFavoritesButDoesntSupportIdentification =
  "TestExample Doesnt Support Identification Bank";

describe("search", () => {
  it("filters recommended institutions by job type", () => {
    visitAgg();

    const institutionThatIsInFavoriteAndSupportsAll =
      TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME;

    cy.findByText(
      institutionThatIsInFavoritesButDoesntSupportIdentification,
    ).should("exist");

    cy.visit(`/widget?job_type=all&user_id=${crypto.randomUUID()}`);

    cy.findByText(institutionThatIsInFavoriteAndSupportsAll).should("exist");

    cy.findByText(
      institutionThatIsInFavoritesButDoesntSupportIdentification,
    ).should("not.exist");
  });

  describe("Fuzzy Search: Should be able to find certain banks with keywords and misspellings", () => {
    it("Finds expected banks", () => {
      visitAgg();

      searchByText("tex");
      cy.findByText(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME, {
        timeout: 45000,
      }).should("exist");

      cy.findByPlaceholderText("Search").clear().type("testexamplo");
      cy.findByText(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME, {
        timeout: 45000,
      }).should("exist");
    });

    it("Ranks search results in the best way", () => {
      visitAgg();

      cy.findByPlaceholderText("Search").clear().type("TestExample");
      cy.findByText(TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME).should("exist");
      cy.get('[data-test="institution-tile"]').then((institutions) => {
        expect(institutions.length).to.be.at.least(3);

        let noIdentificationBankFound = false;

        for (let i = 0; i < 3; i++) {
          const ariaLabel = institutions.eq(i).attr("aria-label");
          if (
            ariaLabel ===
            `Add account with ${institutionThatIsInFavoritesButDoesntSupportIdentification}`
          ) {
            noIdentificationBankFound = true;
          }
        }

        expect(noIdentificationBankFound).to.be.true;
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

      searchByText("test example");
      cy.findByText(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME, {
        timeout: 45000,
      }).should("exist");
      cy.findByText(
        institutionThatIsInFavoritesButDoesntSupportIdentification,
      ).should("not.exist");
    });
  });

  describe("Search by routing number", () => {
    it('shows "America First Credit Union" when the routing number is entered into search', () => {
      visitAgg();

      searchByText("111111111");
      cy.findByText(TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME).should("exist");
      cy.findByText(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME).should("not.exist");
    });
  });
});
