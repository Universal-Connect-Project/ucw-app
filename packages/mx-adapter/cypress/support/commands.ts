import '@testing-library/cypress/add-commands'

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
  const userId = crypto.randomUUID()

  cy.visit(`/?job_type=aggregate&user_id=${userId}`)

  return cy.wrap(userId)
})

Cypress.Commands.add('visitIdentity', () => {
  const userId = crypto.randomUUID()

  cy.visit(`/?job_type=identity&user_id=${userId}`)

  return cy.wrap(userId)
})

Cypress.Commands.add('visitWithPostMessageSpy', (url: string) => {
  cy.visit(url, {
    onBeforeLoad(window) {
      cy.spy(window.parent, 'postMessage').as('postMessage')
    }
  })
})

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      visitAgg: () => Chainable<string>
      visitIdentity: () => Chainable<string>
      visitWithPostMessageSpy: (url: string) => Chainable<string>
    }
  }
}
