import { sophtronVcTranscationsData } from '../../test/testData/sophtronVcData'
import { getVc } from './vc'

describe('Sophtron Vc Client', () => {
  it('returns the data from a vc endpoint', async () => {
    const response = await getVc(
      'customers/userId/accounts/accountId/transactions'
    )

    expect(response).toEqual(sophtronVcTranscationsData)
  })
})
