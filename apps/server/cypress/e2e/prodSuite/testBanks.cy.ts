import { visitAgg } from "@repo/utils-dev-dependency";
import { TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME } from "../../shared/constants/testExample";

const prodBank = "TestExample Prod";

describe("testBanks", () => {
  it("filters out test banks when prod is the env", () => {
    visitAgg();

    cy.findByPlaceholderText("Search").type("test example");

    cy.findAllByText(prodBank).should("exist");
    cy.findByText(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME).should("not.exist");
  });
});
