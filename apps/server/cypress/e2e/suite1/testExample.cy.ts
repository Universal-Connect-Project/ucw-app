import generateVcDataTests from '../../utils/generateVcDataTests'
import {
  enterTestExampleCredentials,
  searchAndSelectTestExample
} from '../../utils/testExample'
import { clickContinue, expectConnectionSuccess } from '../../utils/widget'

const makeAConnection = async () => {
  searchAndSelectTestExample()
  enterTestExampleCredentials()
  clickContinue()

  expectConnectionSuccess()
}

describe('testExample provider', () => {
  generateVcDataTests({ makeAConnection })
})
