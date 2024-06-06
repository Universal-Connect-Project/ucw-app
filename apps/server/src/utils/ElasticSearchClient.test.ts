import testPreferences from '../../cachedDefaults/testData/testPreferences.json'
import * as preferences from '../shared/preferences'
import { elasticSearchInstitutionData } from '../test/testData/institution'
import {
  ElasticSearchMock,
  getInstitution,
  getRecommendedInstitutions,
  initialize,
  reIndexElasticSearch,
  search
} from '../utils/ElasticSearchClient'

jest
  .spyOn(preferences, 'getPreferences')
  .mockResolvedValue(testPreferences as preferences.Preferences)

describe('initialize', () => {
  describe('elastic search already indexed', () => {
    let indexCreated: boolean = false

    it('does not reindex institutions', async () => {
      ElasticSearchMock.clearAll()
      ElasticSearchMock.add(
        {
          method: 'HEAD',
          path: '/institutions'
        },
        () => {
          return ''
        }
      )

      ElasticSearchMock.add(
        {
          method: 'PUT',
          path: '/institutions'
        },
        () => {
          indexCreated = true
          return ''
        }
      )

      await initialize()
      expect(indexCreated).toBeFalsy()
    })
  })

  describe('elastic search not indexed', () => {
    let indexCreated: boolean

    it('triggers the reIndexElasticSearch method which makes call ES create index endpoint', async () => {
      ElasticSearchMock.clearAll()
      ElasticSearchMock.add(
        {
          method: 'PUT',
          path: '/institutions'
        },
        () => {
          indexCreated = true
          return ''
        }
      )

      ElasticSearchMock.add(
        {
          method: 'PUT',
          path: '/institutions/_doc/*'
        },
        () => {
          return ''
        }
      )

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

    ElasticSearchMock.add(
      {
        method: 'PUT',
        path: '/institutions'
      },
      () => {
        indexCreated = true
        return ''
      }
    )

    ElasticSearchMock.add(
      {
        method: 'PUT',
        path: '/institutions/_doc/*'
      },
      () => {
        institutionsIndexedCount += 1
        return ''
      }
    )

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
    ElasticSearchMock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    name: {
                      query: 'MX Bank',
                      boost: 1.5
                    }
                  }
                },
                {
                  match: {
                    keywords: {
                      query: 'MX Bank',
                      boost: 1.4
                    }
                  }
                },
                {
                  fuzzy: {
                    name: {
                      value: 'mx bank',
                      fuzziness: 'AUTO',
                      boost: 1,
                      max_expansions: 50
                    }
                  }
                },
                {
                  wildcard: {
                    name: {
                      value: 'MX Bank*',
                      boost: 0.8
                    }
                  }
                }
              ],
              minimum_should_match: 1,
              must_not: {
                terms: {
                  'ucp_id.keyword': [
                    'UCP-60155b7292895ed'
                  ]
                }
              }
            }
          },
          size: 20
        }
      },
      () => {
        return {
          hits: {
            hits: [
              {
                _source: elasticSearchInstitutionData
              }
            ]
          }
        }
      }
    )

    const results = await search('MX Bank')

    expect(results).toEqual([elasticSearchInstitutionData])
  })

  it('does not break when ES returns an empty array', async () => {
    ElasticSearchMock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search']
      },
      () => {
        return {
          hits: { hits: [] }
        }
      }
    )

    const results = await search('nothing')

    expect(results).toEqual([])
  })
})

describe('getInstitution', () => {
  it('makes the expected ES call and gets the expected institution response', async () => {
    ElasticSearchMock.clearAll()

    ElasticSearchMock.add(
      {
        method: 'GET',
        path: '/institutions/_doc/UCP-1234'
      },
      (params) => {
        return {
          _source: elasticSearchInstitutionData
        }
      }
    )

    const institutionResponse = await getInstitution('UCP-1234')
    expect(institutionResponse).toEqual(elasticSearchInstitutionData)
  })
})

describe('getRecommendedInstitutions', () => {
  it('makes expected call to ES and gets a list of favorite institutions', async () => {
    ElasticSearchMock.clearAll()

    ElasticSearchMock.add(
      {
        method: 'POST',
        path: '/_mget',
        body: {
          docs: testPreferences.recommendedInstitutions.map(
            (institutionId: string) => ({
              _index: 'institutions',
              _id: institutionId
            })
          )
        }
      },
      (params) => {
        return {
          docs: [{ _source: elasticSearchInstitutionData }]
        }
      }
    )

    const recommendedInstitutions = await getRecommendedInstitutions()

    expect(recommendedInstitutions).toEqual([elasticSearchInstitutionData])
  })
})
