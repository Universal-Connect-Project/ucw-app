import { LocalInstitutionFactory } from '../test/testData/institution'
import { availableProviders } from './institutionResolver'

describe('availableProviders', () => {
  it('gets mx and sophtron providers', () => {
    const expectedProviders = ['mx', 'sophtron']
    const institution = new LocalInstitutionFactory('mxbank', 'sophtronBank', null, null).instance()

    expect(availableProviders(institution)).toEqual(expectedProviders)
  })

  it('gets sophtron, finicity, akoya providers', () => {
    const institution = new LocalInstitutionFactory(null, 'sophtronBank', 'finbank', 'akoyabank').instance()
    const expectedProviders = ['sophtron', 'finicity', 'akoya']

    expect(availableProviders(institution)).toEqual(expectedProviders)
  })

  it('gets mx provider', () => {
    const institution = new LocalInstitutionFactory('mxbank', null, null, null).instance()
    const expectedProviders = ['mx']

    expect(availableProviders(institution)).toEqual(expectedProviders)
  })
})
