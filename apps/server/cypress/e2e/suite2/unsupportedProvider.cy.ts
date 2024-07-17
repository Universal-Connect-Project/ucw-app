import { searchByText } from '../../utils/widget'

describe('unsupported provider', () => {
  it('filters out institutions which are not supported by a provider in your list of supported providers.', () => {
    cy.visitAgg()
    searchByText('MX Bank')

    cy.findByText('BBVA MX').should('exist')
    cy.findByText('https://www.mwabank.com/index.php').should('exist')
    cy.findByText('MX Bank (Oauth)').should('not.exist')
  })
})
