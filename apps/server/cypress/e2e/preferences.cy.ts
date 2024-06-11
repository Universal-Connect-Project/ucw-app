import { PREFERENCES_REDIS_KEY } from '../../src/serviceClients/storageClient/constants'
import { setNoExpiration } from '../../src/serviceClients/storageClient/redis'
// These tests expect local preferences to match testPreferences.json
describe('preferences', () => {
  // it('uses local preferences to show favorite institutions', () => {
  //   cy.visitAgg()

  //   const institutions = [
  //     'Wells Fargo',
  //     'Capital One',
  //     'Bank of America',
  //     'Citibank',
  //     'TD Bank (US)',
  //     'PNC Bank'
  //   ]

  //   institutions.forEach((institutionName) => {
  //     cy.findByText(institutionName).should('exist')
  //   })
  // })

  // it('uses local preferences to hide institutions when searching', () => {
  //   cy.visitAgg()
  //   cy.findByPlaceholderText('Search').type('cando')

  //   cy.findByText('First State Bank of Cando').should('exist')
  //   cy.findByText('CanDo CU').should('not.exist')
  // })

  it('doesnt show mx banks when mx is not a supported provider', async () => {
    // await cy.updatePreferences({
    //   supportedProviders: ['sophtron'],
    //   recommendedInstitutions: []
    // })
    await setNoExpiration(PREFERENCES_REDIS_KEY, {
      supportedProviders: ['sophtron'],
      recommendedInstitutions: []
    })

    cy.visitAgg()

    cy.findByPlaceholderText('Search').type('MX Bank')

    cy.findByText('BBVA MX').should('exist')
    cy.findByText('MX Bank').should('not.exist')
    cy.findByText('MX Bank (Oauth)').should('not.exist')
  })
})
