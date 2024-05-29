import { CachedInstitutionFactory } from '../test/factories/cachedInstitutionFactory'
import { getAvailableProviders } from './institutionResolver'

describe('getAvailableProviders', () => {
  it('gets mx and sophtron providers', () => {
    const expectedProviders = ['mx', 'sophtron']
    const institution = new CachedInstitutionFactory('mxbank', 'sophtronBank', null, null).instance()

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })

  it('gets sophtron, finicity, akoya providers', () => {
    const institution = new CachedInstitutionFactory(null, 'sophtronBank', 'finbank', 'akoyabank').instance()
    const expectedProviders = ['sophtron', 'finicity', 'akoya']

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })

  it('gets mx provider', () => {
    const institution = new CachedInstitutionFactory('mxbank', null, null, null).instance()
    const expectedProviders = ['mx']

    expect(getAvailableProviders(institution)).toEqual(expectedProviders)
  })
})
