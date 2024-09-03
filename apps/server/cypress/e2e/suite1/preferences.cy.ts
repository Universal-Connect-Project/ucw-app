import { searchByText } from '../../utils/widget'

// These tests expect local preferences to match testPreferences.json
describe('preferences', () => {
  it('uses local preferences to show favorite institutions', () => {
    cy.visitAgg()

    cy.findByText('TestExampleA Bank').should('exist')
  })

  it('uses local preferences to hide institutions when searching', () => {
    cy.visitAgg()
    searchByText('test bank')

    cy.findByText('TestExampleA Bank').should('exist')
    cy.findByText('TestExampleB Bank').should('exist')
    cy.findByText('TestExample Bank To Hide').should('not.exist')
  })
})
