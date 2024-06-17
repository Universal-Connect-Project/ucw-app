describe('unsupported provider', () => {
  it('filters out institutions which are not supported by a provider in your list of supported providers.', async () => {
    cy.visitAgg()
    cy.findByPlaceholderText('Search').type('MX Bank')

    cy.findByText('0 search results').should('exist')
  })
})
