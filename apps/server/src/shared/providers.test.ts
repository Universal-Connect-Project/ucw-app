import { CachedInstitution, MappedJobTypes, Providers } from './contract'
import { getAvailableProviders } from './providers'

const institutionProvidersSupportEverything: CachedInstitution = {
  name: 'test',
  keywords: null,
  mx: {
    id: 'mx',
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_account_statement: true,
    supports_history: true
  },
  sophtron: {
    id: 'sophtron',
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_account_statement: true,
    supports_history: true
  }
} as CachedInstitution

describe('providers', () => {
  describe('getAvailableProviders', () => {
    it('returns all the providers if they support each of the job types', () => {
      expect(
        getAvailableProviders(
          institutionProvidersSupportEverything,
          MappedJobTypes.AGGREGATE,
          [Providers.MX, Providers.SOPHTRON]
        )
      )
    })

    it("doesnt return mx if it's not in the supported providers", () => {})

    it("doesnt return mx if it's not in the institution", () => {})

    it('doesnt return mx if job type is all and supports_verification is falsy', () => {})

    it('doesnt return mx if job type is all and supports_identification is falsy', () => {})

    it('doesnt return mx if job type is verification and supports_verification is falsy', () => {})

    it('doesnt return mx if job type is identity and supports_identity is falsy', () => {})

    it("doesnt return sophtron if it's not in the supported providers", () => {})

    it("doesnt return sophtron if it's not in the institution", () => {})

    it('doesnt return sophtron if job type is all and supports_verification is falsy', () => {})

    it('doesnt return sophtron if job type is all and supports_identification is falsy', () => {})

    it('doesnt return sophtron if job type is verification and supports_verification is falsy', () => {})

    it('doesnt return sophtron if job type is identity and supports_identity is falsy', () => {})
  })
})
