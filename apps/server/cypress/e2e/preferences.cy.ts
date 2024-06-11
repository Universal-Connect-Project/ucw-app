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

  it('doesnt show mx banks when mx is not a supported provider', async () => {
    cy.visitAgg()

    cy.findByPlaceholderText('Search').type('Unsupported Provider')

    cy.findByText('0 search results').should('exist')
  })
})
