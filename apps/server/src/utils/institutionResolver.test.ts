import { CachedInstitutionFactory } from '../test/factories/cachedInstitutionFactory'
import { getAvailableProviders } from './institutionResolver'

describe('getAvailableProviders', () => {
  it('gets mx and sophtron providers', () => {
    const expectedProviders = ['mx', 'sophtron']
    const institution = new CachedInstitutionFactory(
      'mxbank',
      'sophtronBank',
      null,
      null
    ).instance()

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })

  // This is temporary until we fully support finicity and akoya
  it('only returns mx and sophtron even if finbank and akoya are configured', () => {
    const institution = new CachedInstitutionFactory(
      'mxbank',
      'sophtronBank',
      'finbank',
      'akoyabank'
    ).instance()
    const expectedProviders = ['mx', 'sophtron']

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })

  it('gets mx provider', () => {
    const institution = new CachedInstitutionFactory(
      'mxbank',
      null,
      null,
      null
    ).instance()
    const expectedProviders = ['mx']

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })
})
