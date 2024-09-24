import { VCDataTypes } from '@repo/utils'
import { getAggregatorAdapter, getVC } from './adapterIndex'
import type { Aggregator } from './adapterSetup'
import {
  mxVcAccountsData,
  mxVcIntegrationAccountsData
} from './test/testData/mxVcData'
import { sophtronVcAccountsData } from './test/testData/sophtronVcData'
import { TEST_EXAMPLE_A_AGGREGATOR_STRING, TestAdapter } from './test-adapter'

const connectionId = 'testConectionId'
const type = VCDataTypes.ACCOUNTS
const userId = 'testUserId'

describe('adapterSetup', () => {
  describe('getVC', () => {
    it('uses mx integration if the aggregator is mx_int', async () => {
      const response = await getVC({
        aggregator: 'mx_int',
        connectionId,
        type,
        userId
      })

      expect(response).toEqual(mxVcIntegrationAccountsData)
    })
    it('uses mx prod if the aggregator is mx', async () => {
      const response = await getVC({
        aggregator: 'mx',
        connectionId,
        type,
        userId
      })

      expect(response).toEqual(mxVcAccountsData)
    })
    it('uses sophtron if the aggregator is sophtron', async () => {
      const response = await getVC({
        aggregator: 'sophtron',
        connectionId,
        type,
        userId
      })

      expect(response).toEqual(sophtronVcAccountsData)
    })

    it('throws an error if the aggregator doesnt have a handler', async () => {
      await expect(
        async () =>
          await getVC({
            aggregator: 'junk' as Aggregator,
            connectionId,
            type,
            userId
          })
      ).rejects.toThrow('Unsupported aggregator junk')
    })
  })

  describe('getAggregatorAdapter', () => {
    it('throws an error if its an unsupported aggregator', async () => {
      expect(() => getAggregatorAdapter('junk' as Aggregator)).toThrow(
        'Unsupported aggregator junk'
      )
    })

    it('returns the testExample widget adapter', () => {
      const adapter = getAggregatorAdapter(TEST_EXAMPLE_A_AGGREGATOR_STRING)

      expect(adapter).toBeInstanceOf(TestAdapter)
    })
  })
})
