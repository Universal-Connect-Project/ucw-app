import { searchByText, visitAgg } from "@repo/utils-e2e/cypress";

describe("institution syncing", () => {
  it("shows an MX institution even after the github setup nuked the institution mapping before starting the server", () => {
    visitAgg();

    searchByText("Chase Bank");

    cy.findByLabelText("Add account with Chase Bank").should("exist");
  });
});
