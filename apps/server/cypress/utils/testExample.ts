import { searchByText } from './widget'
import {
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT
} from '../../src/test-adapter'

export const searchAndSelectTestExampleA = () => {
  searchByText('TestExampleA Bank')
  cy.findByLabelText('Add account with TestExampleA Bank').first().click()
}

export const enterTestExampleACredentials = () => {
  cy.findByLabelText(TEST_EXAMPLE_C_LABEL_TEXT).type('anything')
}

export const searchAndSelectTestExampleB = () => {
  searchByText('TestExampleB Bank')
  cy.findByLabelText('Add account with TestExampleB Bank').first().click()
}

export const enterTestExampleBCredentials = () => {
  cy.findByLabelText(TEST_EXAMPLE_B_LABEL_TEXT).type('anything')
}
