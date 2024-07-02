import {
  sophtronVcAccountsData,
  sophtronVcIdentityData,
  sophtronVcTranscationsData
} from '../../test/testData/sophtronVcData'
import getVC from './sophtronVc'

describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'
  const startTime = '1/1/2024'
  const endTime = '6/1/2024'

  it('gets identity VC', async () => {
    const vc = await getVC(connectionId, 'identity', userId)

    expect(vc).toEqual(sophtronVcIdentityData)
  })

  it('gets accounts VC', async () => {
    const vc = await getVC(connectionId, 'accounts', userId)
    expect(vc).toEqual(sophtronVcAccountsData)
  })

  it('gets transactions VC', async () => {
    const vc = await getVC(
      connectionId,
      'transactions',
      userId,
      accountId,
      startTime,
      endTime
    )
    expect(vc).toEqual(sophtronVcTranscationsData)
  })
})
