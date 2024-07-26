describe('testBanks', () => {
  it('filters out test banks when prod is the env', () => {
    cy.visitAgg()

    cy.findByPlaceholderText('Search').type('MX Bank')

    cy.findAllByText('MWABank').should('exist')
    cy.findByText('MX Bank').should('not.exist')
  })
})
