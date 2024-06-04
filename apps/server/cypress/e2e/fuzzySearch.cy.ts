describe('Should be able to find certain banks with keywords and misspellings', () => {
  it('Finds expected banks', () => {
    cy.visitAgg()
    cy.findByPlaceholderText('Search').type('MACU')
    cy.findByText('Mountain America Credit Union', { timeout: 45000 }).should('exist')

    cy.findByPlaceholderText('Search').clear().type('ACU')
    cy.findByText('Altana Federal Credit Union', { timeout: 45000 }).should('exist')

    cy.findByPlaceholderText('Search').clear().type('chape')
    cy.findByText('Chase Bank', { timeout: 45000 }).should('exist')

    cy.findByPlaceholderText('Search').clear().type('wells')
    cy.findByText('Wells Fargo', { timeout: 45000 }).should('exist')
  })
})
