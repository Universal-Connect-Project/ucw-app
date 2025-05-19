import {
  MX_BANK_NAME,
  MX_BANK_TO_HIDE_NAME,
} from "@repo/mx-adapter/src/testInstitutions";
import { searchByText, visitAgg } from "@repo/utils-cypress";

// These tests expect local preferences to match testPreferences.json
describe("preferences", () => {
  it("uses local preferences to show favorite institutions", () => {
    visitAgg();

    cy.findByText(MX_BANK_NAME).should("exist");
  });

  it("uses local preferences to hide institutions when searching", () => {
    visitAgg();
    searchByText(MX_BANK_NAME);

    cy.findByText(MX_BANK_NAME).should("exist");
    cy.findByText(MX_BANK_TO_HIDE_NAME).should("not.exist");
  });
});
