import generateVcDataTests from '../../shared/utils/generateVcDataTests'
import {
  enterTestExampleACredentials,
  enterTestExampleBCredentials,
  searchAndSelectTestExampleA,
  searchAndSelectTestExampleB
} from '../../shared/utils/testExample'
import {
  clickContinue,
  expectConnectionSuccess
} from '../../shared/utils/widget'

const makeAnAConnection = async () => {
  searchAndSelectTestExampleA()
  enterTestExampleACredentials()
  clickContinue()

  expectConnectionSuccess()
}

const makeABConnection = async () => {
  searchAndSelectTestExampleB()
  enterTestExampleBCredentials()
  clickContinue()

  expectConnectionSuccess()
}

describe('testExampleA and B providers', () => {
  generateVcDataTests({ makeAConnection: makeAnAConnection })
  generateVcDataTests({ makeAConnection: makeABConnection })
})
