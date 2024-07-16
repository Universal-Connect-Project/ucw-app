export const submitCredentials = () => {
  cy.findByRole('button', { name: 'Continue' }).click()
}

export const expectConnectionSuccess = () => {
  cy.findByText('Connected', { timeout: 90000 }).should('exist')
}
