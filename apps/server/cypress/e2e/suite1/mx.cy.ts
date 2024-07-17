import { JobTypes } from '../../../src/shared/contract'
import generateVcDataTests from '../../utils/generateVcDataTests'
import { enterMxCredentials, searchAndSelectMx } from '../../utils/mx'
import { clickContinue, expectConnectionSuccess } from '../../utils/widget'

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
})
