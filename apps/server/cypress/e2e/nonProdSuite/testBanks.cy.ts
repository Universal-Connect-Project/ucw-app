import { visitAgg } from "@repo/utils-cypress";
import { testChaseBankToFilter } from "../../../src/testInstitutions/testInstitutions";

const prodBank = "Chase Bank";

describe("testBanks", () => {
  it("keeps test banks when prod is not the env", () => {
    visitAgg();

    cy.findByPlaceholderText("Search").type(prodBank);

    cy.findAllByText(prodBank).should("exist");
    cy.findByText(testChaseBankToFilter.name).should("exist");
  });

  it("filters out test banks from recommended institutions list when prod is not the env", () => {
    visitAgg();

    cy.findAllByText(prodBank).should("exist");
    cy.findByText(testChaseBankToFilter.name).should("exist");
  });
});
