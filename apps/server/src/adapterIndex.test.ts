import { getProviderAdapter } from './adapterIndex'
import type { Provider } from './adapterSetup'

describe('adapterSetup', () => {
  describe('getProviderAdapter', () => {
    it('throws an error if its an unsupported provider', async () => {
      expect(() => getProviderAdapter('junk' as Provider)).toThrow(
        'Unsupported provider junk'
      )
    })
  })
})
