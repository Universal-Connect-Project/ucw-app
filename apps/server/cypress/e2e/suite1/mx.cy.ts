import { JobTypes } from '../../../src/utils/index'
import generateVcDataTests from '../../utils/generateVcDataTests'

const makeAConnection = async (jobType) => {
  cy.findByPlaceholderText('Search').type('MX Bank')
  cy.findByLabelText('Add account with MX Bank').first().click()
  cy.findByLabelText('LOGIN').type('mxuser')
  cy.findByLabelText('PASSWORD').type('correct')
  cy.findByRole('button', { name: 'Continue' }).click()

  if ([JobTypes.ALL, JobTypes.VERIFICATION].includes(jobType)) {
    cy.findByText('Checking').click()
    cy.findByRole('button', { name: 'Continue' }).click()
  }
  cy.findByText('Connected', { timeout: 90000 }).should('exist')
}

describe('mx provider', () => {
  generateVcDataTests({ makeAConnection })
})
