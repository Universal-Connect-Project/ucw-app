import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData
} from '../../test/testData/mxVcData'
import getVC from './mxVc'

describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'

  it('gets accounts VC from INT environment', async () => {
    const isProd = false

    const vc = await getVC(isProd, connectionId, 'accounts', userId)
    expect(vc).toEqual(mxVcIntegrationAccountsData)
  })

  it('gets identity VC from Prod environment', async () => {
    const isProd = true

    const vc = await getVC(isProd, connectionId, 'identity', userId)
    expect(vc).toEqual(mxVcIdentityData)
  })

  it('gets accounts VC from Prod environment', async () => {
    const isProd = true

    const vc = await getVC(isProd, connectionId, 'accounts', userId)
    expect(vc).toEqual(mxVcAccountsData)
  })

  it('gets transactions VC from Prod environment', async () => {
    const isProd = true

    const vc = await getVC(
      isProd,
      connectionId,
      'transactions',
      userId,
      accountId
    )
    expect(vc).toEqual(mxVcTranscationsData)
  })
})
