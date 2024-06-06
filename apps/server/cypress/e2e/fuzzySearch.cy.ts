describe('Should be able to find certain banks with keywords and misspellings', () => {
  beforeEach(() => {
    cy.visitAgg()
  })

  it('Finds expected banks', () => {
    cy.findByPlaceholderText('Search').type('MACU')
    cy.findByText('Mountain America Credit Union', { timeout: 45000 }).should('exist')

    cy.findByPlaceholderText('Search').clear().type('AFCU')
    cy.findByText('Altana Federal Credit Union', { timeout: 45000 }).should('exist')

    cy.findByPlaceholderText('Search').clear().type('chape')
    cy.findByText('Chase UCard', { timeout: 45000 }).should('exist')

    cy.findByPlaceholderText('Search').clear().type('wells')
    cy.findByText('Wells Fargo', { timeout: 45000 }).should('exist')
  })

  it('Ranks search results in the best way', () => {
    cy.findByPlaceholderText('Search').clear().type('chase')
    cy.get('[data-test="institution-tile"]').first().should('have.attr', 'aria-label', 'Add account with Chase (CA)')
    cy.get('[data-test="institution-tile"]').eq(1).should('have.attr', 'aria-label', 'Add account with Chase UCard')
  })
})
