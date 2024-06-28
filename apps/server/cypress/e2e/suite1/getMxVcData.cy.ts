describe('Create a connection in agg mode and get vc data', () => {
  // go through the connection process capturing postmessages into variables
  // need member guid, user guid

  // verify account returns a VC object and get an accountGuid from decoded response
  it('gets account VC data', () => {
    let memberGuid: string
    let provider: string
    let userGuid: string

    cy.visit('/?job_type=agg', {
      onBeforeLoad(win) {
        cy.spy(win.parent, 'postMessage').as('postMessage')
      }
    })
      .then(() => {
        cy.findByPlaceholderText('Search').type('MX Bank')
        cy.findByLabelText('Add account with MX Bank').first().click()
        cy.findByLabelText('LOGIN').type('mxuser')
        cy.findByLabelText('PASSWORD').type('correct')
        cy.findByRole('button', { name: 'Continue' }).click()
        cy.findByText('Connected', { timeout: 45000 }).should('exist')
      })
      .then(() => {
        cy.get('@postMessage', { timeout: 90000 }).then((mySpy) => {
          const found = mySpy
            .getCalls()
            .find((call) => call.args[0].type === 'vcs/connect/memberConnected')
          const { metadata } = found?.args[0]
          memberGuid = metadata.member_guid
          provider = metadata.provider
          userGuid = metadata.user_guid
          cy.request(
            'GET',
            `/data/accounts?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}`
          ).then((response) => {
            expect(response.status).to.equal(200)
            expect(response.body).to.haveOwnProperty('jwt')
            expect(response.body.jwt).not.to.haveOwnProperty('error')
            // We have to extract the AccountGuid from the base64 encoded jwt token
            const jwt = response.body.jwt
            const data = jwt.split('.')[1] // gets the middle part of the jwt
            const decodedVcData = JSON.parse(atob(data))
            // Verify the proper VC came back
            expect(decodedVcData.vc.type).to.include(
              'FinancialAccountCredential'
            )
            const account = decodedVcData.vc.credentialSubject.accounts.find(
              (acc) => Object.keys(acc)[0] === 'depositAccount'
            )

            const accountId = account.depositAccount.accountId
            // now test identity
            cy.request(
              'GET',
              `/data/identity?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}&accountId=${accountId}`
            ).should((response) => {
              expect(response.status).to.equal(200)
              expect(response.body).to.haveOwnProperty('jwt')
              expect(response.body.jwt).not.to.haveOwnProperty('error')
              const jwt = response.body.jwt
              const data = jwt.split('.')[1] // gets the middle part of the jwt
              const decodedVcData = JSON.parse(atob(data))
              // Verify the proper VC came back
              expect(decodedVcData.vc.type).to.include(
                'FinancialIdentityCredential'
              )
            })
            cy.request(
              'GET',
              `/data/transactions?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}&accountId=${accountId}`
            ).should((response) => {
              expect(response.status).to.equal(200)
              expect(response.body).to.haveOwnProperty('jwt')
              expect(response.body.jwt).not.to.haveOwnProperty('error')
              const jwt = response.body.jwt
              const data = jwt.split('.')[1] // gets the middle part of the jwt
              const decodedVcData = JSON.parse(atob(data))
              // Verify the proper VC came back
              expect(decodedVcData.vc.type).to.include(
                'FinancialTransactionCredential'
              )
            })
          })
        })
      })
  })
})
