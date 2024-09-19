import { VCDataTypes } from '@repo/utils'
import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData
} from '../../test/testData/mxVcData'
import { mxIntGetVC, mxProdGetVC } from './mxVc'

describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'

  it('gets accounts VC from INT environment', async () => {
    const vc = await mxIntGetVC({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId
    })
    expect(vc).toEqual(mxVcIntegrationAccountsData)
  })

  it('gets identity VC from Prod environment', async () => {
    const vc = await mxProdGetVC({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId
    })
    expect(vc).toEqual(mxVcIdentityData)
  })

  it('gets accounts VC from Prod environment', async () => {
    const vc = await mxProdGetVC({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId
    })
    expect(vc).toEqual(mxVcAccountsData)
  })

  it('gets transactions VC from Prod environment', async () => {
    const vc = await mxProdGetVC({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId
    })
    expect(vc).toEqual(mxVcTranscationsData)
  })
})
