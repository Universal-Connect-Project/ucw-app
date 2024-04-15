describe('Should connect to an Institution through happy path', () => {
  beforeEach(() => {
    cy.setAuthCode()
  })

  it('Connects to Sophtron No MFA', () => {
    const authCode = Cypress.env('authCode')

    cy.visit(`http://localhost:8080/?job_type=agg&auth=${authCode}`)
    cy.findByPlaceholderText('Search').type('Sophtron Bank NoMFA')
    cy.findByLabelText('Add account with Sophtron Bank NoMFA').first().click()
    cy.findByLabelText('User ID').type('asdf')
    cy.findByText('Password').type('asdf')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 45000 }).should('exist')
  })

  it('Connects to Sophtron Bank with all MFA options', () => {
    const authCode = Cypress.env('authCode')

    cy.visit(`http://localhost:8080/?job_type=agg&auth=${authCode}`)
    cy.findByPlaceholderText('Search').type('Sophtron Bank')
    cy.findByLabelText('Add account with Sophtron Bank').first().click()
    cy.findByLabelText('User ID').type('asdfg12X')
    cy.findByText('Password').type('asdfg12X')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByRole('textbox', { name: 'Please enter the Captcha code', timeout: 45000 }).type('asdf')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByLabelText('What is your favorite color?', { timeout: 45000 }).type('asdf')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('xxx-xxx-1234', { timeout: 45000 }).click()
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByRole('textbox', { name: 'Please Enter the Token', timeout: 45000 }).type('asdf')
    cy.findByRole('button', { name: 'Continue' }).click()

    cy.findByText('Connected', { timeout: 90000 }).should('exist')
  })
})
