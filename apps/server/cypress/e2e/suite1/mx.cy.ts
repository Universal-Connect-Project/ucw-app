import { JobTypes } from '../../../src/utils/index'

const jobTypes = Object.values(JobTypes)

const decodeVcDataFromResponse = (response) => {
  const data = response.body.jwt.split('.')[1] // gets the middle part of the jwt
  return JSON.parse(atob(data))
}

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

const verifyAccountsAndReturnAccountId = ({
  provider,
  memberGuid,
  userGuid
}) => {
  return cy
    .request(
      'GET',
      `/data/accounts?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}`
    )
    .then((response) => {
      expect(response.status).to.equal(200)
      expect(response.body).to.haveOwnProperty('jwt')
      expect(response.body.jwt).not.to.haveOwnProperty('error')

      const decodedVcData = decodeVcDataFromResponse(response)
      // Verify the proper VC came back
      expect(decodedVcData.vc.type).to.include('FinancialAccountCredential')
      const account = decodedVcData.vc.credentialSubject.accounts.find(
        (acc) => Object.keys(acc)[0] === 'depositAccount'
      )

      return account.depositAccount.accountId
    })
}

const verifyIdentity = ({ accountId, provider, memberGuid, userGuid }) => {
  cy.request(
    'GET',
    `/data/identity?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}&accountId=${accountId}`
  ).should((response) => {
    expect(response.status).to.equal(200)
    expect(response.body).to.haveOwnProperty('jwt')
    expect(response.body.jwt).not.to.haveOwnProperty('error')

    const decodedVcData = decodeVcDataFromResponse(response)
    // Verify the proper VC came back
    expect(decodedVcData.vc.type).to.include('FinancialIdentityCredential')
  })
}

const verifyTransactions = ({ accountId, memberGuid, provider, userGuid }) => {
  cy.request(
    'GET',
    `/data/transactions?provider=${provider}&connectionId=${memberGuid}&userId=${userGuid}&accountId=${accountId}`
  ).should((response) => {
    expect(response.status).to.equal(200)
    expect(response.body).to.haveOwnProperty('jwt')
    expect(response.body.jwt).not.to.haveOwnProperty('error')

    const decodedVcData = decodeVcDataFromResponse(response)
    // Verify the proper VC came back
    expect(decodedVcData.vc.type).to.include('FinancialTransactionCredential')
  })
}

describe('mx provider', () => {
  jobTypes.map((jobType) =>
    it(`makes a connection with jobType: ${jobType}, gets the accounts, identity, and transaction data from the vc endpoints`, () => {
      let memberGuid: string
      let provider: string
      let userGuid: string

      cy.visit(`/?job_type=${jobType}`, {
        onBeforeLoad(window) {
          cy.spy(window.parent, 'postMessage').as('postMessage')
        }
      })
        .then(() => makeAConnection(jobType))
        .then(() => {
          // Capture postmessages into variables
          cy.get('@postMessage', { timeout: 90000 }).then((mySpy) => {
            const connection = (mySpy as any)
              .getCalls()
              .find(
                (call) => call.args[0].type === 'vcs/connect/memberConnected'
              )
            const { metadata } = connection?.args[0]
            memberGuid = metadata.member_guid
            provider = metadata.provider
            userGuid = metadata.user_guid

            verifyAccountsAndReturnAccountId({
              memberGuid,
              provider,
              userGuid
            }).then((accountId) => {
              verifyIdentity({
                accountId,
                memberGuid,
                provider,
                userGuid
              })

              verifyTransactions({
                accountId,
                memberGuid,
                provider,
                userGuid
              })
            })
          })
        })
    })
  )
})
