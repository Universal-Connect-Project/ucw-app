import { JobTypes } from '../../../src/shared/contract'
import { enterMxCredentials, searchAndSelectMx } from '../../utils/mx'
import {
  connectToSophtron,
  enterSophtronCredentials,
  searchAndSelectSophtron,
  selectSophtronAccount
} from '../../utils/sophtron'
import { clickContinue, expectConnectionSuccess } from '../../utils/widget'

const MX_BANK_INSTITUTION_ID = 'UCP-bb5296bd5aae5d9'

const refreshAConnection = ({ enterCredentials, selectInstitution }) => {
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

describe('query parameters', () => {
  it('skips straight to the institution if an institution_id is provided in the query parameters, hides the back button, and completes the connection', () => {
    const userId = Cypress.env('userId')

    cy.visitWithPostMessageSpy(
      `/?job_type=aggregate&institution_id=${MX_BANK_INSTITUTION_ID}&user_id=${userId}`
    ).then(() => {
      enterMxCredentials()

      clickContinue()

      expectConnectionSuccess()
    })
  })

  it('refreshes a sophtron connection if given the correct parameters and hides the back button', () => {
    refreshAConnection({
      enterCredentials: enterSophtronCredentials,
      selectInstitution: searchAndSelectSophtron
    })
  })

  it('refreshes an mx connection if given the correct parameters and hides the back button', () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx
    })
  })

  it('shows single account select if no parameter is passed, and skips single account select if single_account_select=false', () => {
    const userId = Cypress.env('userId')

    cy.visit(`/?job_type=${JobTypes.VERIFICATION}&user_id=${userId}`)

    searchAndSelectSophtron()

    enterSophtronCredentials()

    clickContinue()

    selectSophtronAccount()
    clickContinue()

    expectConnectionSuccess()

    cy.visit(
      `/?job_type=${JobTypes.VERIFICATION}&user_id=${userId}&single_account_select=false`
    )

    connectToSophtron()
  })
})
