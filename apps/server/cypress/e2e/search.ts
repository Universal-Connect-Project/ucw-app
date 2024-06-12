describe('Should be able to find certain banks with keywords and misspellings', () => {
  it('Finds expected banks', () => {
    cy.visitAgg()

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
    cy.visitAgg()

    cy.findByPlaceholderText('Search').clear().type('chase')
    cy.findByText('Chase (CA)')
    cy.get('[data-test="institution-tile"]').then(institutions => {
      expect(institutions.length).to.be.at.least(3)

      let chaseCaFound = false
      let chaseUCardFound = false

      for (let i = 0; i < 3; i++) {
        const ariaLabel = institutions.eq(i).attr('aria-label');
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

