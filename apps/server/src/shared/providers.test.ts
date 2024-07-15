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

const allProviders = [Providers.MX, Providers.SOPHTRON]

const filterOutProvider = (provider: Providers) =>
  allProviders.filter((currentProvider) => currentProvider !== provider)

const generateProviderTests = (provider: Providers) =>
  describe(`getAvailableProviders tests for provider: ${provider}`, () => {
    it(`doesnt return ${provider} if it's not in the supported providers`, () => {
      const providersWithoutCurrentProvider = filterOutProvider(provider)

      expect(
        getAvailableProviders(
          institutionProvidersSupportEverything,
          MappedJobTypes.AGGREGATE,
          providersWithoutCurrentProvider
        )
      ).toEqual(providersWithoutCurrentProvider)
    })

    it(`doesnt return ${provider} if it's not in the institution`, () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            [provider]: {}
          } as any,
          MappedJobTypes.AGGREGATE,
          allProviders
        )
      ).toEqual(filterOutProvider(provider))
    })

    it(`doesnt return ${provider} if job type is all and supports_verification is falsy`, () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_verification: false
            }
          },
          MappedJobTypes.ALL,
          allProviders
        )
      ).toEqual(filterOutProvider(provider))
    })

    it(`doesnt return ${provider} if job type is all and supports_identification is falsy`, () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_identification: false
            }
          },
          MappedJobTypes.ALL,
          allProviders
        )
      ).toEqual(filterOutProvider(provider))
    })

    it(`doesnt return ${provider} if job type is verification and supports_verification is falsy`, () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_verification: false
            }
          },
          MappedJobTypes.VERIFICATION,
          allProviders
        )
      ).toEqual(filterOutProvider(provider))
    })

    it(`doesnt return ${provider} if job type is identity and supports_identity is falsy`, () => {
      expect(
        getAvailableProviders(
          {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_identification: false
            }
          },
          MappedJobTypes.IDENTITY,
          allProviders
        )
      ).toEqual(filterOutProvider(provider))
    })
  })

describe('providers', () => {
  describe('getAvailableProviders', () => {
    it('returns all the providers if they support each of the job types', () => {
      Object.values(MappedJobTypes).forEach((mappedJobType) => {
        expect(
          getAvailableProviders(
            institutionProvidersSupportEverything,
            mappedJobType,
            allProviders
          )
        ).toEqual(allProviders)
      })
    })

    generateProviderTests(Providers.MX)

    generateProviderTests(Providers.SOPHTRON)
  })
})
