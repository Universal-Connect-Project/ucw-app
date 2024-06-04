import { elasticSearchInstitutionData } from '../test/testData/institution'
import { ElasticSearchMock, getFavoriteInstitutions, getInstitution, initialize, reIndexElasticSearch, search } from '../utils/ElasticSearchClient'

describe('initialize', () => {
  describe('elastic search already indexed', () => {
    let indexCreated: boolean = false

    it('does not reindex institutions', async () => {
      ElasticSearchMock.clearAll()
      ElasticSearchMock.add({
        method: 'HEAD',
        path: '/institutions'
      }, () => {
        return ''
      })

      ElasticSearchMock.add({
        method: 'PUT',
        path: '/institutions'
      }, () => {
        indexCreated = true
        return ''
      })

      await initialize()
      expect(indexCreated).toBeFalsy()
    })
  })

  describe('elastic search not indexed', () => {
    let indexCreated: boolean

    it('triggers the reIndexElasticSearch method which makes call ES create index endpoint', async () => {
      ElasticSearchMock.clearAll()
      ElasticSearchMock.add({
        method: 'PUT',
        path: '/institutions'
      }, () => {
        indexCreated = true
        return ''
      })

      ElasticSearchMock.add({
        method: 'PUT',
        path: '/institutions/_doc/*'
      }, () => {
        return ''
      })

      await initialize()
      expect(indexCreated).toBeTruthy()
    })
  })
})

describe('reIndexElasticSearch', () => {
  let indexCreated: boolean
  let institutionsIndexedCount: number

  it('makes call to create index and makes call to index more than 4 institutions', async () => {
    ElasticSearchMock.clearAll()
    indexCreated = false
    institutionsIndexedCount = 0

    ElasticSearchMock.add({
      method: 'PUT',
      path: '/institutions'
    }, () => {
      indexCreated = true
      return ''
    })

    ElasticSearchMock.add({
      method: 'PUT',
      path: '/institutions/_doc/*'
    }, () => {
      institutionsIndexedCount += 1
      return ''
    })

    await reIndexElasticSearch()
    expect(indexCreated).toBeTruthy()
    expect(institutionsIndexedCount).toBeGreaterThan(4)
  })
})

describe('search', () => {
  beforeEach(() => {
    ElasticSearchMock.clearAll()
  })

  it('makes the expected ES call and maps the data', async () => {
    ElasticSearchMock.add({
      method: ['GET', 'POST'],
      path: ['/_search', '/institutions/_search'],
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: 'MX Bank',
                  type: 'best_fields',
                  fields: [
                    'name',
                    'keywords'
                  ],
                  fuzziness: 'AUTO',
                  prefix_length: 0,
                  max_expansions: 50,
                  fuzzy_transpositions: true
                }
              },
              {
                match: {
                  'keywords.keyword': {
                    query: 'MX Bank'
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        size: 20
      }
    }, () => {
      return {
        hits: {
          hits: [
            {
              _source: elasticSearchInstitutionData
            }
          ]
        }
      }
    })

    const results = await search('MX Bank')

    expect(results).toEqual([elasticSearchInstitutionData])
  })

  it('does not break when ES returns an empty array', async () => {
    ElasticSearchMock.add({
      method: ['GET', 'POST'],
      path: ['/_search', '/institutions/_search']
    }, () => {
      return {
        hits: { hits: [] }
      }
    })

    const results = await search('nothing')

    expect(results).toEqual([])
  })
})

describe('getInstitution', () => {
  it('makes the expected ES call and gets the expected institution response', async () => {
    ElasticSearchMock.clearAll()

    ElasticSearchMock.add({
      method: 'GET',
      path: '/institutions/_doc/UCP-1234'
    }, (params) => {
      return {
        _source: elasticSearchInstitutionData
      }
    })

    const institutionResponse = await getInstitution('UCP-1234')
    expect(institutionResponse).toEqual(elasticSearchInstitutionData)
  })
})

describe('getFavoriteInstitutions', () => {
  it('makes expected call to ES and gets a list of favorite institutions', async () => {
    ElasticSearchMock.clearAll()

    ElasticSearchMock.add({
      method: 'POST',
      path: '/_mget',
      body: {
        docs: [
          { _index: 'institutions', _id: 'UCP-b087caf69b372c9' },
          { _index: 'institutions', _id: 'UCP-60155b7292895ed' },
          { _index: 'institutions', _id: 'UCP-ce8334bbb890163' },
          { _index: 'institutions', _id: 'UCP-ebca9a2b2ae2cca' },
          { _index: 'institutions', _id: 'UCP-b0a4307160ecb4c' },
          { _index: 'institutions', _id: 'UCP-8c4ca4c32dbd8de' },
          { _index: 'institutions', _id: 'UCP-412ded54698c47f' }
        ]
      }
    }, (params) => {
      return {
        docs: [
          { _source: elasticSearchInstitutionData }
        ]
      }
    })

    const favoriteInsitutions = await getFavoriteInstitutions()

    expect(favoriteInsitutions).toEqual([elasticSearchInstitutionData])
  })
})
