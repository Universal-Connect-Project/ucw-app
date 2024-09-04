import { JobTypes } from '../../../src/shared/contract'
import generateVcDataTests from '../../shared/utils/generateVcDataTests'
import {
  enterTestExampleACredentials,
  enterTestExampleBCredentials,
  searchAndSelectTestExampleA,
  searchAndSelectTestExampleB,
  selectTestExampleAAccount
} from '../../shared/utils/testExample'
import {
  clickContinue,
  expectConnectionSuccess
} from '../../shared/utils/widget'

const makeAnAConnection = async (jobType) => {
  searchAndSelectTestExampleA()
  enterTestExampleACredentials()
  clickContinue()

  if ([JobTypes.VERIFICATION, JobTypes.ALL].includes(jobType)) {
    selectTestExampleAAccount()
    clickContinue()
  }

  expectConnectionSuccess()
}

const makeABConnection = async (jobType) => {
  searchAndSelectTestExampleB()
  enterTestExampleBCredentials()
  clickContinue()

  if ([JobTypes.VERIFICATION, JobTypes.ALL].includes(jobType)) {
    selectTestExampleAAccount()
    clickContinue()
  }

  expectConnectionSuccess()
}

describe('testExampleA and B providers', () => {
  generateVcDataTests({ makeAConnection: makeAnAConnection })
  generateVcDataTests({ makeAConnection: makeABConnection })
})
