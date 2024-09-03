import generateVcDataTests from '../../utils/generateVcDataTests'
import {
  enterTestExampleACredentials,
  enterTestExampleBCredentials,
  searchAndSelectTestExampleA,
  searchAndSelectTestExampleB
} from '../../utils/testExample'
import { clickContinue, expectConnectionSuccess } from '../../utils/widget'

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
