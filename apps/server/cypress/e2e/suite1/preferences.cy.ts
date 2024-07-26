import { searchByText } from '../../utils/widget'

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
    searchByText('Pinnacle Bank')

    cy.findByText('Pinnacle Bank (WY)').should('exist')
    cy.findByText('Pinnacle Bank').should('not.exist')
  })
})
