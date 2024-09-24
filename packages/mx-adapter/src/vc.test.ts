import { getVC } from 'packages/mx-adapter/src/vc'
import { VCDataTypes } from 'packages/utils'
import {
  accountsResponse,
  identityResponse,
  transactionsResponse
} from 'packages/mx-adapter/src/vcResponses'

describe('vc', () => {
  describe('getVC', () => {
    it('returns the accounts response', () => {
      expect(getVC({ type: VCDataTypes.ACCOUNTS })).toEqual(accountsResponse)
    })
    it('returns the identity response', () => {
      expect(getVC({ type: VCDataTypes.IDENTITY })).toEqual(identityResponse)
    })
    it('returns the transactions response', () => {
      expect(getVC({ type: VCDataTypes.TRANSACTIONS })).toEqual(
        transactionsResponse
      )
    })
  })
})
