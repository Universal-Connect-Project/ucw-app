import { JobTypes } from '../../../src/shared/contract'
import generateVcDataTests from '../../shared/utils/generateVcDataTests'
import { enterMxCredentials, searchAndSelectMx } from '../../shared/utils/mx'
import { refreshAConnection } from '../../shared/utils/refresh'
import {
  clickContinue,
  expectConnectionSuccess
} from '../../shared/utils/widget'

const makeAConnection = async (jobType) => {
  searchAndSelectMx()
  enterMxCredentials()
  clickContinue()

  if ([JobTypes.ALL, JobTypes.VERIFICATION].includes(jobType)) {
    cy.findByText('Checking').click()
    clickContinue()
  }
  expectConnectionSuccess()
}

describe('mx provider', () => {
  generateVcDataTests({ makeAConnection })

  it('refreshes an mx connection if given the correct parameters and hides the back button', () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx
    })
  })
})
