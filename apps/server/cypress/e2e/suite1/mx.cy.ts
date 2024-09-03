import { JobTypes } from '../../../src/shared/contract'
import generateVcDataTests from '../../shared/utils/generateVcDataTests'
import { enterMxCredentials, searchAndSelectMx } from '../../shared/utils/mx'
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
})
