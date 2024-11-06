import { searchByText, visitAgg } from "@repo/utils-dev-dependency";

// These tests expect local preferences to match testPreferences.json
describe("preferences", () => {
  it("uses local preferences to show favorite institutions", () => {
    visitAgg();

    cy.findByText("TestExampleA Bank").should("exist");
  });

  it("uses local preferences to hide institutions when searching", () => {
    visitAgg();
    searchByText("test bank");

    cy.findByText("TestExampleA Bank").should("exist");
    cy.findByText("TestExampleB Bank").should("exist");
    cy.findByText("TestExample Bank To Hide").should("not.exist");
  });
});
