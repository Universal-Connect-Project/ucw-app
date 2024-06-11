import '@testing-library/cypress/add-commands'
// import { PREFERENCES_REDIS_KEY } from '../../src/serviceClients/storageClient/constants'
// import { setNoExpiration } from '../../src/serviceClients/storageClient/redis'
// import { Preferences } from '../../src/shared/preferences'

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//

Cypress.Commands.add('visitAgg', () => {
  cy.visit('http://localhost:8080/?job_type=agg')
})

Cypress.Commands.add('updatePreferences', (preferences) => {
  // await setNoExpiration(PREFERENCES_REDIS_KEY, preferences.toString())
  // await setNoExpiration('test', 'hi')
})

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      visitAgg: () => Chainable<void>
      updatePreferences: (preferences: Preferences) => Promise<Chainable<void>>
    }
  }
}
