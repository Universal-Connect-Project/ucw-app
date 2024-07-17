import { searchByText } from '../../utils/widget'

describe('search', () => {
  it('filters recommended institutions by job type', () => {
    cy.visitAgg()

    const institutionThatIsInFavoritesButDoesntSupportAll =
      'ExxonMobil Card - Yod 9.0.3'

    cy.findByText(institutionThatIsInFavoritesButDoesntSupportAll).should(
      'exist'
    )

    cy.visit(`/?job_type=all&user_id=${crypto.randomUUID()}`)

    cy.findByText('Wells Fargo').should('exist')

    cy.findByText(institutionThatIsInFavoritesButDoesntSupportAll).should(
      'not.exist'
    )
  })

  describe('Fuzzy Search: Should be able to find certain banks with keywords and misspellings', () => {
    it('Finds expected banks', () => {
      cy.visitAgg()

      searchByText('MACU')
      cy.findByText('Mountain America Credit Union', { timeout: 45000 }).should(
        'exist'
      )

      cy.findByPlaceholderText('Search').clear().type('AFCU')
      cy.findByText('Altana Federal Credit Union', { timeout: 45000 }).should(
        'exist'
      )

      cy.findByPlaceholderText('Search').clear().type('chape')
      cy.findByText('Chase UCard', { timeout: 45000 }).should('exist')

      cy.findByPlaceholderText('Search').clear().type('wells')
      cy.findByText('Wells Fargo', { timeout: 45000 }).should('exist')
    })

    it('Ranks search results in the best way', () => {
      cy.visitAgg()

      cy.findByPlaceholderText('Search').clear().type('chase')
      cy.findByText('Chase (CA)')
      cy.get('[data-test="institution-tile"]').then((institutions) => {
        expect(institutions.length).to.be.at.least(3)

        let chaseCaFound = false
        let chaseUCardFound = false

        for (let i = 0; i < 3; i++) {
          const ariaLabel = institutions.eq(i).attr('aria-label')
          if (ariaLabel === 'Add account with Chase (CA)') {
            chaseCaFound = true
          } else if (ariaLabel === 'Add account with Chase UCard') {
            chaseUCardFound = true
          }
        }

        expect(chaseCaFound).to.be.true
        expect(chaseUCardFound).to.be.true
      })
    })
  })

  describe('Job type influences the returned institutions', () => {
    it('shows "Liberty Federal Credit Union" for agg job type', () => {
      cy.visitAgg()

      searchByText('Liberty Federal Credit Union')
      cy.findByText('https://www.libertyfcu.org/', { timeout: 45000 }).should(
        'exist'
      )
    })

    it('does not show "Liberty Federal Credit Union" for identity job type because that job type is not supported', () => {
      cy.visitIdentity()

      searchByText('Liberty Federal Credit Union')
      cy.findByText('Purdue Federal Credit Union', { timeout: 45000 }).should(
        'exist'
      )
      cy.findByText('https://www.libertyfcu.org/').should('not.exist')
    })
  })
})
