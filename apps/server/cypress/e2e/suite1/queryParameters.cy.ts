import { JobTypes } from '../../../src/shared/contract'
import { enterMxCredentials, searchAndSelectMx } from '../../shared/utils/mx'
import { refreshAConnection } from '../../shared/utils/refresh'
import {
  connectToSophtron,
  enterSophtronCredentials,
  searchAndSelectSophtron,
  selectSophtronAccount
} from '../../shared/utils/sophtron'
import {
  enterTestExampleACredentials,
  searchAndSelectTestExampleA,
  selectTestExampleAAccount
} from '../../shared/utils/testExample'
import {
  clickContinue,
  expectConnectionSuccess
} from '../../shared/utils/widget'

const MX_BANK_INSTITUTION_ID = 'UCP-bb5296bd5aae5d9'

const TEST_EXAMPLE_A_INSTITUTION_ID = 'UCP-testexamplea'

describe('query parameters', () => {
  it('skips straight to the institution if an institution_id is provided in the query parameters, hides the back button, and completes the connection', () => {
    const userId = Cypress.env('userId')

    cy.visitWithPostMessageSpy(
      `/?job_type=aggregate&institution_id=${TEST_EXAMPLE_A_INSTITUTION_ID}&user_id=${userId}`
    ).then(() => {
      enterTestExampleACredentials()

      clickContinue()

      expectConnectionSuccess()
    })
  })

  it('refreshes a testExampleA connection if given the correct parameters and hides the back button', () => {
    refreshAConnection({
      enterCredentials: enterTestExampleACredentials,
      selectInstitution: searchAndSelectTestExampleA
    })
  })

  it('shows single account select if no parameter is passed, and skips single account select if single_account_select=false', () => {
    const userId = Cypress.env('userId')

    cy.visit(`/?job_type=${JobTypes.VERIFICATION}&user_id=${userId}`)

    searchAndSelectTestExampleA()

    enterTestExampleACredentials()

    clickContinue()

    selectTestExampleAAccount()
    clickContinue()

    expectConnectionSuccess()

    cy.visit(
      `/?job_type=${JobTypes.VERIFICATION}&user_id=${userId}&single_account_select=false`
    )

    searchAndSelectTestExampleA()

    enterTestExampleACredentials()

    clickContinue()

    expectConnectionSuccess()
  })
})
