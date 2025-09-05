import { visitAgg } from "@repo/utils-e2e/cypress";
import { testChaseBankToFilter } from "../../../src/testInstitutions/testInstitutions";

const prodBank = "Chase Bank";

describe("testBanks", () => {
  it("filters out test banks when prod is the env", () => {
    visitAgg();

    cy.findByPlaceholderText("Search").type(prodBank);

    cy.findAllByText(prodBank).should("exist");
    cy.findByText(testChaseBankToFilter.name).should("not.exist");
  });

  it("filters out test banks from recommended institutions list when prod is the env", () => {
    visitAgg();

    cy.findAllByText(prodBank).should("exist");
    cy.findByText(testChaseBankToFilter.name).should("not.exist");
  });
});
