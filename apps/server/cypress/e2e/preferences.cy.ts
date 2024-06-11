// These tests expect local preferences to match testPreferences.json
describe('preferences', () => {
  it('uses local preferences to show favorite institutions', () => {
    cy.visitAgg()

    const institutions = [
      'Wells Fargo',
      'Capital One',
      'Bank of America',
      'Citibank',
      'TD Bank (US)',
      'PNC Bank'
    ]

    institutions.forEach((institutionName) => {
      cy.findByText(institutionName).should('exist')
    })
  })

  it('uses local preferences to hide institutions when searching', () => {
    cy.visitAgg()
    cy.findByPlaceholderText('Search').type('cando')

    cy.findByText('First State Bank of Cando').should('exist')
    cy.findByText('CanDo CU').should('not.exist')
  })

  it('filters out institutions which are not supported by a provider in your list of supported providers.', async () => {
    cy.visitAgg()

    // "Unsupported Provider" is a test institution included in the institution list solely for this test
    // it will never show in search as long as the supportedProviders preference works because it doesn't
    // have any providers configured.
    cy.findByPlaceholderText('Search').type('Unsupported Provider')

    cy.findByText('0 search results').should('exist')
  })
})
