import {
  sophtronVcAccountsData,
  sophtronVcIdentityData,
  sophtronVcTranscationsData
} from '../../test/testData/sophtronVcData'
import getVC from './sophtronVc'
import { VCDataTypes } from '@repo/utils'

describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'
  const startTime = '1/1/2024'
  const endTime = '6/1/2024'

  it('gets identity VC', async () => {
    const vc = await getVC({ connectionId, type: VCDataTypes.IDENTITY, userId })

    expect(vc).toEqual(sophtronVcIdentityData)
  })

  it('gets accounts VC', async () => {
    const vc = await getVC({ connectionId, type: VCDataTypes.ACCOUNTS, userId })
    expect(vc).toEqual(sophtronVcAccountsData)
  })

  it('gets transactions VC', async () => {
    const vc = await getVC({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      startTime,
      endTime
    })
    expect(vc).toEqual(sophtronVcTranscationsData)
  })
})
