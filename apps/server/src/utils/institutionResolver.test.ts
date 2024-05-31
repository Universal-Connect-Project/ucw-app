import { cachedInstitution } from '../test/factories/cachedInstitutionFactory'
import { getAvailableProviders } from './institutionResolver'

describe('getAvailableProviders', () => {
  it('gets mx and sophtron providers', () => {
    const expectedProviders = ['mx', 'sophtron']
    const institution = cachedInstitution(
      'mxbank',
      'sophtronBank',
      null,
      null
    )

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })

  // This is temporary until we fully support finicity and akoya
  it('only returns mx and sophtron even if finbank and akoya are configured', () => {
    const institution = cachedInstitution(
      'mxbank',
      'sophtronBank',
      'finbank',
      'akoyabank'
    )
    const expectedProviders = ['mx', 'sophtron']

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })

  it('gets mx provider', () => {
    const institution = cachedInstitution(
      'mxbank',
      null,
      null,
      null
    )
    const expectedProviders = ['mx']

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })
})
