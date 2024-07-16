import { expectConnectionSuccess, clickContinue } from './widget'

export const searchAndSelectSophtron = () => {
  cy.findByPlaceholderText('Search').type('Sophtron Bank NoMFA')
  cy.findByLabelText('Add account with Sophtron Bank NoMFA').first().click()
}

export const enterSophtronCredentials = () => {
  cy.findByLabelText('User ID').type('asdf')
  cy.findByText('Password').type('asdf')
}

export const selectSophtronAccount = () => {
  cy.findByText('Primary Checking 1234', { timeout: 45000 }).click()
}

export const connectToSophtron = () => {
  searchAndSelectSophtron()

  enterSophtronCredentials()

  clickContinue()

  expectConnectionSuccess()
}
