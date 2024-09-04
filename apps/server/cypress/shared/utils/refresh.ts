import { clickContinue, expectConnectionSuccess } from './widget'

export const refreshAConnection = ({ enterCredentials, selectInstitution }) => {
  const userId = Cypress.env('userId')

  cy.visitWithPostMessageSpy(`/?job_type=aggregate&user_id=${userId}`).then(
    () => {
      // Make the initial connection
      selectInstitution()

      enterCredentials()

      clickContinue()

      expectConnectionSuccess()

      // Capture postmessages into variables
      cy.get('@postMessage', { timeout: 90000 }).then((mySpy) => {
        const connection = (mySpy as any)
          .getCalls()
          .find((call) => call.args[0].type === 'vcs/connect/memberConnected')
        const { metadata } = connection?.args[0]
        const memberGuid = metadata.member_guid
        const provider = metadata.provider

        //Refresh the connection
        cy.visit(
          `/?job_type=aggregate&connection_id=${memberGuid}&provider=${provider}&user_id=${userId}`
        )

        enterCredentials()

        cy.findByRole('button', { name: 'Back' }).should('not.exist')

        clickContinue()

        expectConnectionSuccess()
      })
    }
  )
}
