import { TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME } from '../../shared/constants/testExample'
import { searchByText } from '../../shared/utils/widget'

describe('unsupported provider', () => {
  it('filters out institutions which are not supported by a provider in your list of supported providers.', () => {
    cy.visitAgg()
    searchByText('MX Bank')

    cy.findByText(TEST_EXAMPLE_B_ONLY_INSTITUTION_NAME).should('exist')
    cy.findByText('MX Bank').should('not.exist')
  })
})
