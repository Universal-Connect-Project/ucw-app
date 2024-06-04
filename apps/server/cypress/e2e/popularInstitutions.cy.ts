// describe('popular institutions', () => {
//   ;[
//     { labelText: 'User ID', name: 'Citibank' },
//     { labelText: 'Username', name: 'Chase Bank' },
//     { labelText: 'Username', name: 'Wells Fargo' },
//     { labelText: 'Online ID', name: 'Bank of America' },
//     { labelText: 'User ID', name: 'Barclays' },
//     { labelText: 'User ID', name: 'BB&T' },
//     { labelText: 'Username', name: 'Capital One' },
//     { labelText: 'User ID', name: 'USAA' },
//     { labelText: 'Enter User ID', name: 'Fifth Third Bank' },
//     { labelText: 'Username', name: 'Goldman Sachs' },
//     { labelText: 'Username', name: 'Fidelity Investments' },
//     { labelText: 'User name', name: 'Vanguard' },
//     { labelText: 'Username', name: 'Voya Financial' },
//     { labelText: 'Username', name: 'Empower Retirement' }
//   ].map(({ labelText, name }) =>
//     it(`shows the login for ${name}`, () => {
//       cy.visitAgg()

//       cy.findByPlaceholderText('Search').type(name)
//       cy.findByLabelText(`Add account with ${name}`).click()

//       cy.findByLabelText(labelText).should('exist')
//     })
//   )
// })
