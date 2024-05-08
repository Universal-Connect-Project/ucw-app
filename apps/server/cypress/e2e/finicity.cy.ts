describe('Should connect to an Institution through happy path', () => {
  beforeEach(() => {
    cy.setAuthCode()
  })

  it('Connects to Finbank profiles a', () => {
    const authCode = Cypress.env('authCode')

    cy.visit(`http://localhost:8080/?job_type=agg&auth=${authCode}`)
    cy.findByPlaceholderText('Search').type('finbank profiles')
    cy.findByLabelText('Add account with finbank profiles - a').click()

    cy.findByRole('link', { name: 'Continue' }).should('exist')
  })
})
