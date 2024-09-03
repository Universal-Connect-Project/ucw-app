import { JobTypes } from '../../../src/shared/contract'

const jobTypes = Object.values(JobTypes)

const decodeVcDataFromResponse = (response) => {
  const data = response.body.jwt.split('.')[1] // gets the middle part of the jwt
  return JSON.parse(atob(data))
}

const verifyAccountsAndReturnAccountId = ({ provider, memberGuid, userId }) => {
  return cy
    .request(
      'GET',
      `/data/provider/${provider}/user/${userId}/connection/${memberGuid}/accounts`
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

const verifyIdentity = ({ provider, memberGuid, userId }) => {
  cy.request(
    'GET',
    `/data/provider/${provider}/user/${userId}/connection/${memberGuid}/identity`
  ).should((response) => {
    expect(response.status).to.equal(200)
    expect(response.body).to.haveOwnProperty('jwt')
    expect(response.body.jwt).not.to.haveOwnProperty('error')

    const decodedVcData = decodeVcDataFromResponse(response)
    // Verify the proper VC came back
    expect(decodedVcData.vc.type).to.include('FinancialIdentityCredential')
  })
}

const verifyTransactions = ({ accountId, provider, userId }) => {
  cy.request(
    'GET',
    `/data/provider/${provider}/user/${userId}/account/${accountId}/transactions${provider === 'sophtron' ? '?start_time=2021/1/1&end_time=2024/12/31' : ''}`
  ).should((response) => {
    expect(response.status).to.equal(200)
    expect(response.body).to.haveOwnProperty('jwt')
    expect(response.body.jwt).not.to.haveOwnProperty('error')

    const decodedVcData = decodeVcDataFromResponse(response)
    // Verify the proper VC came back
    expect(decodedVcData.vc.type).to.include('FinancialTransactionCredential')
  })
}

const generateVcDataTests = ({ makeAConnection }) =>
  jobTypes.map((jobType) =>
    it(`makes a connection with jobType: ${jobType}, gets the accounts, identity, and transaction data from the vc endpoints`, () => {
      let memberGuid: string
      let provider: string
      const userId = Cypress.env('userId')

      cy.visitWithPostMessageSpy(`/?job_type=${jobType}&user_id=${userId}`)
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

            verifyAccountsAndReturnAccountId({
              memberGuid,
              provider,
              userId
            }).then((accountId) => {
              verifyIdentity({
                memberGuid,
                provider,
                userId
              })

              verifyTransactions({
                accountId,
                provider,
                userId
              })
            })
          })
        })
    })
  )

export default generateVcDataTests
