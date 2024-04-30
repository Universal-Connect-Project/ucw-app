describe('Should connect to an Institution through happy path', () => {
  beforeEach(() => {
    cy.setAuthCode()
  })

  it('Connects to MX Bank', () => {
    const authCode = Cypress.env('authCode')

    cy.visit(`http://localhost:8080/?job_type=agg&auth=${authCode}`)
    cy.findByPlaceholderText('Search').type('MX Bank')
    cy.findByLabelText('Add account with MX Bank').first().click()
    cy.findByLabelText('LOGIN').type('mxuser')
    cy.findByLabelText('PASSWORD').type('correct')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 45000 }).should('exist')
  })

  it('Connects to MX Bank (OAuth)', () => {
    const authCode = Cypress.env('authCode')

    cy.visit(`http://localhost:8080/?job_type=agg&auth=${authCode}`)
    cy.findByPlaceholderText('Search').type('MX Bank (Oauth)')
    cy.findByLabelText('Add account with MX Bank (Oauth)').first().click()

    cy.findByRole('link', { name: 'Continue' }).should('exist')
  })
})
