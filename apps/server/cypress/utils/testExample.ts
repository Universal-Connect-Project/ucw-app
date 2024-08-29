import { searchByText } from './widget'
import { TEST_EXAMPLE_A_LABEL_TEXT } from '../../src/test-adapter'

export const searchAndSelectTestExample = () => {
  searchByText('TestExample Bank')
  cy.findByLabelText('Add account with TestExample Bank').first().click()
}

export const enterTestExampleCredentials = () => {
  cy.findByLabelText(TEST_EXAMPLE_A_LABEL_TEXT).type('anything')
}
