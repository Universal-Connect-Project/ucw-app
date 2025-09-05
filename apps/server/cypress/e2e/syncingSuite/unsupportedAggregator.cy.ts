import { searchByText, visitAgg } from "@repo/utils-e2e/cypress";

describe("unsupported aggregator", () => {
  it("filters out institutions which are not supported by an aggregator in your list of supported aggregators.", () => {
    visitAgg();
    searchByText("sophtron");

    cy.findByText("Soperton").should("exist");
    cy.findByText("Sophtron Bank").should("not.exist");
  });
});
