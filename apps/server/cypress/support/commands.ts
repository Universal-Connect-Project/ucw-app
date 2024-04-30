import '@testing-library/cypress/add-commands'

import * as crypto from 'crypto'
import providerCredentials from './providerCredentials'

const encrypt = (text: string, keyHex: string, ivHex: string) => {
  if (!text) {
    return ''
  }

  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted.toString('hex')
}

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
  const key = Buffer.from(Cypress.env('ucp_encryption_key'), 'base64').toString('hex')
  const iv = crypto.randomBytes(16).toString('hex')
  const body = { Payload: encrypt(JSON.stringify(providerCredentials), key, iv) }

  cy.request({
    body,
    headers: {
      Authorization: 'basic ' + Buffer.from(`${Cypress.env('ucp_client_id')}:${Cypress.env('ucp_client_secret')}`).toString('base64')
    },
    method: 'POST',
    url: 'https://login.universalconnectproject.org/api/secretexchange'
  }).then((response) => {
    const str = `ucp;${response.body.Token};${iv}`
    const authCode = Buffer.from(str).toString('base64')

    Cypress.env('authCode', authCode)
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
      setAuthCode: () => Chainable<void>
    }
  }
}
