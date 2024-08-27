import { searchByText } from './widget'
import { TEST_EXAMPLE_LABEL_TEXT } from '@repo/test-adapter'

export const searchAndSelectTestExample = () => {
  searchByText('TestExample1 Bank')
  cy.findByLabelText('Add account with TestExample1 Bank').first().click()
}

export const enterTestExampleCredentials = () => {
  cy.findByLabelText(TEST_EXAMPLE_LABEL_TEXT).type('anything')
}
