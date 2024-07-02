import { sophtronVcAccountsData } from '../../test/testData/sophtronVcData'
import {
  mxVcAccountsData,
  mxVcIntegrationAccountsData
} from '../../test/testData/mxVcData'
import getVc from './index'

const connectionId = 'testConectionId'
const type = 'accounts'
const userId = 'testUserId'

describe('vc providers index', () => {
  it('uses mx integration if the provider is mx_int', async () => {
    const response = await getVc('mx_int', connectionId, type, userId)

    expect(response).toEqual(mxVcIntegrationAccountsData)
  })
  it('uses mx prod if the provider is mx', async () => {
    const response = await getVc('mx', connectionId, type, userId)

    expect(response).toEqual(mxVcAccountsData)
  })
  it('uses sophtron if the provider is sophtron', async () => {
    const response = await getVc('sophtron', connectionId, type, userId)

    expect(response).toEqual(sophtronVcAccountsData)
  })
})
