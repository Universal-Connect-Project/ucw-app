const MX_BANK_INSTITUTION_ID = 'UCP-bb5296bd5aae5d9'

const refreshAConnection = ({ enterCredentials, selectInstitution }) => {
  cy.visit(`/?job_type=aggregate`, {
    onBeforeLoad(window) {
      cy.spy(window.parent, 'postMessage').as('postMessage')
    }
  }).then(() => {
    // Make the initial connection
    selectInstitution()

    enterCredentials()

    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 90000 }).should('exist')

    // Capture postmessages into variables
    cy.get('@postMessage', { timeout: 90000 }).then((mySpy) => {
      const connection = (mySpy as any)
        .getCalls()
        .find((call) => call.args[0].type === 'vcs/connect/memberConnected')
      const { metadata } = connection?.args[0]
      const memberGuid = metadata.member_guid
      const provider = metadata.provider
      const userGuid = metadata.user_guid

      //Refresh the connection
      cy.visit(
        `/?job_type=aggregate&connection_id=${memberGuid}&provider=${provider}&user_id=${userGuid}`
      )

      enterCredentials()

      cy.findByRole('button', { name: 'Back' }).should('not.exist')

      cy.findByRole('button', { name: 'Continue' }).click()

      cy.findByText('Connected', { timeout: 90000 }).should('exist')
    })
  })
}

describe('query parameters', () => {
  it('skips straight to the institution if an institution_id is provided in the query parameters, hides the back button, and completes the connection', () => {
    cy.visit(`/?job_type=aggregate&institution_id=${MX_BANK_INSTITUTION_ID}`)

    cy.findByLabelText('LOGIN').type('mxuser')
    cy.findByLabelText('PASSWORD').type('correct')

    cy.findByRole('button', { name: 'Back' }).should('not.exist')

    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 45000 }).should('exist')
  })

  it('refreshes a sophtron connection if given the correct parameters and hides the back button', () => {
    refreshAConnection({
      enterCredentials: () => {
        cy.findByLabelText('User ID').type('asdf')
        cy.findByText('Password').type('asdf')
      },
      selectInstitution: () => {
        cy.findByPlaceholderText('Search').type('Sophtron Bank NoMFA')
        cy.findByLabelText('Add account with Sophtron Bank NoMFA')
          .first()
          .click()
      }
    })
  })

  it('refreshes an mx connection if given the correct parameters and hides the back button', () => {
    refreshAConnection({
      enterCredentials: () => {
        cy.findByLabelText('LOGIN').type('mxuser')
        cy.findByLabelText('PASSWORD').type('correct')
      },
      selectInstitution: () => {
        cy.findByPlaceholderText('Search').type('MX Bank')
        cy.findByLabelText('Add account with MX Bank').first().click()
      }
    })
  })
})
