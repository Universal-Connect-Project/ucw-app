// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

import { configure } from '@testing-library/cypress'

configure({ testIdAttribute: 'data-test' })

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})

beforeEach(() => {
  Cypress.env('userId', crypto.randomUUID())
})

afterEach(() => {
  const testProviders = ['mx_int', 'sophtron']
  const userId = Cypress.env('userId')

  testProviders.forEach((provider) => {
    cy.request({
      method: 'DELETE',
      url: `/user/${userId}?provider=${provider}`,
      failOnStatusCode: false
    }).should((response) => {
      expect(response.status).to.be.oneOf([200, 204, 400])
    })
  })
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
