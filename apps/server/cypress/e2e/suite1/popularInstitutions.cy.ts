import { searchByText } from '../../utils/widget'

describe('popular institutions', () => {
  ;[
    { labelText: 'User ID', name: 'Citibank' },
    { labelText: 'Username', name: 'Chase Bank' },
    { labelText: 'Username', name: 'Wells Fargo' },
    { labelText: 'Online ID', name: 'Bank of America' },
    { labelText: 'Username', name: 'Capital One' },
    {
      labelText: 'User ID',
      name: 'USAA',
      website: 'https://www.usaa.com/inet/ent_logon/Logon'
    },
    { labelText: 'Enter User ID', name: 'Fifth Third Bank' },
    { labelText: 'Username', name: 'Fidelity Investments' },
    { labelText: 'User name', name: 'Vanguard' },
    { labelText: 'Username', name: 'Empower Retirement' }
  ].map(({ labelText, name, website }) =>
    it(`shows the login for ${name}`, () => {
      cy.visitAgg()

      cy.findByText('PNC Bank').should('exist')

      searchByText(name)

      cy.findByText('PNC Bank').should('not.exist')

      if (website) {
        cy.findByText(website).click()
      } else {
        cy.findByLabelText(`Add account with ${name}`).click()
      }

      cy.findByLabelText(labelText).should('exist')
    })
  )
})
