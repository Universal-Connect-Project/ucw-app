import { searchByText } from './widget'

export const searchAndSelectMx = () => {
  searchByText('MX Bank')
  cy.findByLabelText('Add account with MX Bank').first().click()
}

export const enterMxCredentials = () => {
  cy.findByLabelText('LOGIN').type('mxuser')
  cy.findByLabelText('PASSWORD').type('correct')
}
