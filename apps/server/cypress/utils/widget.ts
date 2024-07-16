export const clickContinue = () => {
  cy.findByRole('button', { name: 'Continue' }).click()
}

export const expectConnectionSuccess = () => {
  cy.findByText('Connected', { timeout: 90000 }).should('exist')
}

export const searchByText = (text) => {
  cy.findByPlaceholderText('Search').type(text)
}
