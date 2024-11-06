import { TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME } from "../../shared/constants/testExample";
import { searchByText, visitAgg } from "@repo/utils-dev-dependency";

describe("unsupported aggregator", () => {
  it("filters out institutions which are not supported by a aggregator in your list of supported aggregators.", () => {
    visitAgg();
    searchByText("MX Bank");

    cy.findByText(TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME).should("exist");
    cy.findByText("MX Bank").should("not.exist");
  });
});
