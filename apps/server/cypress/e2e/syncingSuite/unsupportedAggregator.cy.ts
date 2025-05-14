import { searchByText, visitAgg } from "@repo/utils-cypress";

describe("unsupported aggregator", () => {
  it("filters out institutions which are not supported by an aggregator in your list of supported aggregators.", () => {
    visitAgg();
    searchByText("MX Bank");

    cy.findByText("MWABank").should("exist");
    cy.findByText("MX Bank").should("not.exist");
  });
});
