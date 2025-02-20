import {
  searchByText,
  selectInstitutionByName,
} from "@repo/utils-dev-dependency";
import {
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
} from "../../../src/test-adapter/constants";
import {
  TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME,
  TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME,
} from "../constants/testExample";

export const searchAndSelectTestExampleA = () => {
  searchByText(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME);
  selectInstitutionByName(TEST_EXAMPLE_A_ONLY_INSTITUTION_NAME);
};

export const enterTestExampleACredentials = () => {
  cy.findByLabelText(TEST_EXAMPLE_C_LABEL_TEXT).type("anything");
};

export const selectTestExampleAAccount = () => {
  cy.findByText("Checking", { timeout: 45000 }).click();
};

export const searchAndSelectTestExampleB = () => {
  searchByText(TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME);
  selectInstitutionByName(TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME);
};

export const enterTestExampleBCredentials = () => {
  cy.findByLabelText(TEST_EXAMPLE_B_LABEL_TEXT).type("anything");
};
