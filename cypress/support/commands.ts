/* eslint-disable jest/valid-expect */

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
Cypress.Commands.add('setAuthCode' as any, () => {
    cy.request('http://localhost:8088/example/getAuthCode').then(response => {
      const authCode = response.body;
      cy.wrap(authCode).as('authCode')
      Cypress.env('authCode', authCode)
      expect(response.status).to.eq(200)
    })
  })
  
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

export {}

declare global {
    namespace Cypress {
      interface Chainable {
        setAuthCode(): Chainable<void>
      }
    }
}