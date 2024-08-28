import { VCDataTypes } from '@repo/utils'
import { getProviderAdapter, getVC } from './adapterIndex'
import type { Provider } from './adapterSetup'
import {
  mxVcAccountsData,
  mxVcIntegrationAccountsData
} from './test/testData/mxVcData'
import { sophtronVcAccountsData } from './test/testData/sophtronVcData'
import { TestAdapter } from '@repo/test-adapter/adapter'
import { PROVIDER_STRING as TEST_EXAMPLE_PROVIDER_STRING } from '@repo/test-adapter'

const connectionId = 'testConectionId'
const type = VCDataTypes.ACCOUNTS
const userId = 'testUserId'

describe('adapterSetup', () => {
  describe('getVC', () => {
    it('uses mx integration if the provider is mx_int', async () => {
      const response = await getVC({
        provider: 'mx_int',
        connectionId,
        type,
        userId
      })

      expect(response).toEqual(mxVcIntegrationAccountsData)
    })
    it('uses mx prod if the provider is mx', async () => {
      const response = await getVC({
        provider: 'mx',
        connectionId,
        type,
        userId
      })

      expect(response).toEqual(mxVcAccountsData)
    })
    it('uses sophtron if the provider is sophtron', async () => {
      const response = await getVC({
        provider: 'sophtron',
        connectionId,
        type,
        userId
      })

      expect(response).toEqual(sophtronVcAccountsData)
    })

    it('throws an error if the provider doesnt have a handler', async () => {
      await expect(
        async () =>
          await getVC({
            provider: 'junk' as Provider,
            connectionId,
            type,
            userId
          })
      ).rejects.toThrow('Unsupported provider junk')
    })
  })

  describe('getProviderAdapter', () => {
    it('throws an error if its an unsupported provider', async () => {
      expect(() => getProviderAdapter('junk' as Provider)).toThrow(
        'Unsupported provider junk'
      )
    })

    it('returns the testExample widget adapter', () => {
      const adapter = getProviderAdapter(TEST_EXAMPLE_PROVIDER_STRING)

      expect(adapter).toBeInstanceOf(TestAdapter)
    })
  })
})
