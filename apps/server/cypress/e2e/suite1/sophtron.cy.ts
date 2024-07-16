import { JobTypes } from '../../../src/shared/contract'
import generateVcDataTests from '../../utils/generateVcDataTests'
import {
  enterSophtronCredentials,
  searchAndSelectSophtron,
  selectSophtronAccount
} from '../../utils/sophtron'
import {
  expectConnectionSuccess,
  clickContinue,
  searchByText
} from '../../utils/widget'

const makeAConnection = async (jobType) => {
  searchAndSelectSophtron()
  enterSophtronCredentials()
  clickContinue()

  if ([JobTypes.VERIFICATION].includes(jobType)) {
    selectSophtronAccount()
    clickContinue()
  }
  expectConnectionSuccess()
}

describe('Sophtron provider', () => {
  it('Connects to Sophtron Bank with all MFA options', () => {
    cy.visitAgg()
    searchByText('Sophtron Bank')
    cy.findByLabelText('Add account with Sophtron Bank').first().click()
    cy.findByLabelText('User ID').type('asdfg12X')
    cy.findByText('Password').type('asdfg12X')
    clickContinue()

    cy.findByRole('textbox', {
      name: 'Please enter the Captcha code',
      timeout: 45000
    }).type('asdf')
    clickContinue()

    cy.findByLabelText('What is your favorite color?', { timeout: 45000 }).type(
      'asdf'
    )
    clickContinue()

    cy.findByText('xxx-xxx-1234', { timeout: 45000 }).click()
    clickContinue()

    cy.findByRole('textbox', {
      name: 'Please enter the Token',
      timeout: 45000
    }).type('asdf')
    clickContinue()

    expectConnectionSuccess()
  })

  generateVcDataTests({ makeAConnection })
})
