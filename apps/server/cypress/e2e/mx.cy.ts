describe('Should connect to an Institution through happy path', () => {
  it('Connects to MX Bank', () => {
    cy.visitAgg()
    cy.findByPlaceholderText('Search').type('MX Bank')
    cy.findByLabelText('Add account with MX Bank').first().click()
    cy.findByLabelText('LOGIN').type('mxuser')
    cy.findByLabelText('PASSWORD').type('correct')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 45000 }).should('exist')
  })

  it('Connects to MX Bank (OAuth)', () => {
    cy.visitAgg()
    cy.findByPlaceholderText('Search').type('MX Bank (Oauth)')
    cy.findByLabelText('Add account with MX Bank (Oauth)').first().click()

    cy.findByRole('link', { name: 'Continue' }).should('exist')
  })
})
