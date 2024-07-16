import { expectConnectionSuccess, submitCredentials } from './widget'

export const searchAndSelectSophtron = () => {
  cy.findByPlaceholderText('Search').type('Sophtron Bank NoMFA')
  cy.findByLabelText('Add account with Sophtron Bank NoMFA').first().click()
}

export const enterSophtronCredentials = () => {
  cy.findByLabelText('User ID').type('asdf')
  cy.findByText('Password').type('asdf')
}

export const connectToSophtron = () => {
  searchAndSelectSophtron()

  enterSophtronCredentials()

  submitCredentials()

  expectConnectionSuccess()
}
