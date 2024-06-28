const MX_BANK_INSTITUTION_ID = 'UCP-bb5296bd5aae5d9'

describe('query parameters', () => {
  it('skips straight to the institution if an institution_id is provided in the query parameters, hides the back button, and completes the connection', () => {
    cy.visit(`/?job_type=aggregate&institution_id=${MX_BANK_INSTITUTION_ID}`)

    cy.findByLabelText('LOGIN').type('mxuser')
    cy.findByLabelText('PASSWORD').type('correct')

    cy.findByRole('button', { name: 'Back' }).should('not.exist')

    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 45000 }).should('exist')
  })
})
