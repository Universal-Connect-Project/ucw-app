describe('Create a connection in agg mode and get vc data', () => {
  // go through the connection process capturing postmessages into variables
  // need member guid, user guid
  const memberGuid = "MBR-fa51df29-7ee6-4e34-a336-e78c48ffee31"
  const userGuid = "USR-7489713e-9e1c-46b5-9307-0e96a4021ee0"
  let accountGuid = "ACT-0e7e779a-cfce-4b77-aa12-2537df4118ae"
  let container = {}

  // beforeEach(() => {
  //   cy.window().then((win) => {
  //     const listener = e => {
  //       win.removeEventListener('postMessage', listener)
  //       console.log('inside', e)
  //       container['e'] = e
  //     }
  //     // Simulate adding the listener in the application (replace with actual logic)
  //     win.addEventListener('postMessage', listener)
  //   })
  // })

  // verify account returns a VC object and get an accountGuid from decoded response
  it('gets account VC data', () => {
    let memberGuid
    let provider
    let userGuid
    cy.visit('/?job_type=agg', {
      onBeforeLoad(win) {
        cy.spy(win.parent, 'postMessage').as('postMessage')
      },
    }).then(() => {
      cy.findByPlaceholderText('Search').type('MX Bank')
      cy.findByLabelText('Add account with MX Bank').first().click()
      cy.findByLabelText('LOGIN').type('mxuser')
      cy.findByLabelText('PASSWORD').type('correct')
      cy.findByRole('button', { name: 'Continue' }).click()
      cy.findByText('Connected', { timeout: 45000 }).should('exist')
    }).then(() => {
      cy.get('@postMessage', { timeout: 90000 }).then(mySpy => {
        const found = mySpy.getCalls().find(call => call.args[0].type === "vcs/connect/memberConnected")
        const { metadata } = found?.args[0]
        memberGuid = metadata.member_guid
        provider = metadata.provider
        userGuid = metadata.user_guid
        const response = cy.request('GET', `/data/accounts?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}`)
          .should((response) => {
            expect(response.status).to.equal(200)
            expect(response.body).to.haveOwnProperty('jwt')
            expect(response.body.jwt).not.to.haveOwnProperty('error')
          })
        console.log('response', response)
      })
    })

  
  
    // cy.visitAgg().then(() => {
    //   console.log('container', container)
    // })
    // cy.findByPlaceholderText('Search').type('MX Bank')
    // console.log('container', container)



    // cy.request('GET', `/data/accounts?provider=mx_int&connectionId=${memberGuid}&userId=${userGuid}`)
    //   .should((response) => {
    //     expect(response.status).to.equal(200)
    //     expect(response.body).to.haveOwnProperty('jwt')
    //   })
      // accountGuid = "somethingElse"
    // expect response to look like this {
    //   "jwt": "eyJhbGciOiJFZERTQSIsIm..."
    // }
  })

  // verify identity returns a VC object
  // it('gets identity VC data', () => {
  //   cy.request('GET', `/data/identity?provider=mx_int&connectionId=${memberGuid}&userId=${userGuid}&accountId=${accountGuid}`)
  //     .should((response) => {
  //       expect(response.status).to.equal(200)
  //       expect(response.body).to.haveOwnProperty('jwt')
  //     })
  //   // expect response to look like this {
  //   //   "jwt": "eyJhbGciOiJFZERTQSIsIm..."
  //   // }
  // })

  // // verify transactions returns a VC object
  // it('gets transactions VC data', () => {
  //   cy.request('GET', `/data/transactions?provider=mx_int&connectionId=${memberGuid}&userId=${userGuid}&accountId=${accountGuid}`)
  //     .should((response) => {
  //       expect(response.status).to.equal(200)
  //       expect(response.body).to.haveOwnProperty('jwt')
  //     })
  //   // expect response to look like this {
  //   //   "jwt": "eyJhbGciOiJFZERTQSIsIm..."
  //   // }
  // })
})
