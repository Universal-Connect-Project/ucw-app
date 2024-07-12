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
      Object.values(MappedJobTypes).forEach((mappedJobType) => {
        expect(
          getAvailableProviders(
            institutionProvidersSupportEverything,
            mappedJobType,
            [Providers.MX, Providers.SOPHTRON]
          )
        ).toEqual([Providers.MX, Providers.SOPHTRON])
      })
    })

    it("doesnt return mx if it's not in the supported providers", () => {
      expect(
        getAvailableProviders(
          institutionProvidersSupportEverything,
          MappedJobTypes.AGGREGATE,
          [Providers.SOPHTRON]
        )
      ).toEqual([Providers.SOPHTRON])
    })

    it("doesnt return mx if it's not in the institution", () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            mx: {}
          } as any,
          MappedJobTypes.AGGREGATE,
          [Providers.MX, Providers.SOPHTRON]
        )
      ).toEqual([Providers.SOPHTRON])
    })

    it('doesnt return mx if job type is all and supports_verification is falsy', () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            mx: {
              ...institutionProvidersSupportEverything.mx,
              supports_verification: false
            }
          },
          MappedJobTypes.ALL,
          [Providers.MX, Providers.SOPHTRON]
        )
      ).toEqual([Providers.SOPHTRON])
    })

    it('doesnt return mx if job type is all and supports_identification is falsy', () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            mx: {
              ...institutionProvidersSupportEverything.mx,
              supports_identification: false
            }
          },
          MappedJobTypes.ALL,
          [Providers.MX, Providers.SOPHTRON]
        )
      ).toEqual([Providers.SOPHTRON])
    })

    it('doesnt return mx if job type is verification and supports_verification is falsy', () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            mx: {
              ...institutionProvidersSupportEverything.mx,
              supports_verification: false
            }
          },
          MappedJobTypes.VERIFICATION,
          [Providers.MX, Providers.SOPHTRON]
        )
      ).toEqual([Providers.SOPHTRON])
    })

    it('doesnt return mx if job type is identity and supports_identity is falsy', () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            mx: {
              ...institutionProvidersSupportEverything.mx,
              supports_identification: false
            }
          },
          MappedJobTypes.IDENTITY,
          [Providers.MX, Providers.SOPHTRON]
        )
      ).toEqual([Providers.SOPHTRON])
    })

    it("doesnt return sophtron if it's not in the supported providers", () => {})

    it("doesnt return sophtron if it's not in the institution", () => {})

    it('doesnt return sophtron if job type is all and supports_verification is falsy', () => {})

    it('doesnt return sophtron if job type is all and supports_identification is falsy', () => {})

    it('doesnt return sophtron if job type is verification and supports_verification is falsy', () => {})

    it('doesnt return sophtron if job type is identity and supports_identity is falsy', () => {})
  })
})
