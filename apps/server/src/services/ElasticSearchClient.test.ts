import testPreferences from '../../cachedDefaults/testData/testPreferences.json'
import config from '../config'
import {
  ElasticSearchMock,
  getInstitution,
  getRecommendedInstitutions,
  initialize,
  reIndexElasticSearch,
  search,
  searchByRoutingNumber
} from '../services/ElasticSearchClient'
import { MappedJobTypes, Providers } from '../shared/contract'
import * as preferences from '../shared/preferences'
import { elasticSearchInstitutionData } from '../test/testData/institution'

jest
  .spyOn(preferences, 'getPreferences')
  .mockResolvedValue(testPreferences as preferences.Preferences)

interface searchQueryArgs {
  jobTypeQuery?: any[]
  filterTestBanks?: boolean
  routingNumber?: string
}

function searchQuery(args: searchQueryArgs = {}) {
  const {
    jobTypeQuery = [
      {
        bool: {
          must: [
            {
              term: {
                'mx.supports_aggregation': true
              }
            }
          ]
        }
      },
      {
        bool: {
          must: [
            {
              term: {
                'sophtron.supports_aggregation': true
              }
            }
          ]
        }
      },
      {
        bool: {
          must: [
            {
              term: {
                'testExample.supports_aggregation': true
              }
            }
          ]
        }
      }
    ],
    filterTestBanks = false,
    routingNumber
  } = args

  let mainSearchTerm
  if (routingNumber) {
    mainSearchTerm = {
      match: {
        routing_numbers: {
          query: routingNumber
        }
      }
    }
  } else {
    mainSearchTerm = [
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
    ]
  }

  return {
    bool: {
      should: mainSearchTerm,
      minimum_should_match: 1,
      must: {
        bool: {
          should: [
            {
              exists: {
                field: 'mx.id'
              }
            },
            {
              exists: {
                field: 'sophtron.id'
              }
            },
            {
              exists: {
                field: 'testExample.id'
              }
            }
          ],
          minimum_should_match: 1,
          must: {
            bool: {
              should: jobTypeQuery,
              minimum_should_match: 1
            }
          }
        }
      },
      must_not: [
        {
          terms: {
            'ucp_id.keyword': testPreferences.hiddenInstitutions
          }
        },
        ...(filterTestBanks
          ? [
              {
                term: {
                  is_test_bank: true
                }
              }
            ]
          : [])
      ]
    }
  }
}

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
          query: searchQuery(),
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

    const results = await search('MX Bank', MappedJobTypes.AGGREGATE)

    expect(results).toEqual([elasticSearchInstitutionData])
  })

  it('excludes test banks in ES search when Env is prod', async () => {
    config.Env = 'prod'
    ElasticSearchMock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: searchQuery({ filterTestBanks: true }),
          size: 20
        }
      },
      (parms) => {
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

    await search('MX Bank', MappedJobTypes.AGGREGATE)
    config.Env = 'test'
  })

  it('includes a filter when job type is identity', async () => {
    ElasticSearchMock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: searchQuery({
            jobTypeQuery: [
              {
                bool: {
                  must: [
                    {
                      term: {
                        'mx.supports_identification': true
                      }
                    }
                  ]
                }
              },
              {
                bool: {
                  must: [
                    {
                      term: {
                        'sophtron.supports_identification': true
                      }
                    }
                  ]
                }
              },
              {
                bool: {
                  must: [
                    {
                      term: {
                        'testExample.supports_identification': true
                      }
                    }
                  ]
                }
              }
            ]
          }),
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

    const results = await search('MX Bank', MappedJobTypes.IDENTITY)

    expect(results).toEqual([elasticSearchInstitutionData])
  })

  it('includes identity and verification filter when job type is aggregate_identity_verification', async () => {
    ElasticSearchMock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: searchQuery({
            jobTypeQuery: [
              {
                bool: {
                  must: [
                    {
                      term: {
                        'mx.supports_aggregation': true
                      }
                    },
                    {
                      term: {
                        'mx.supports_verification': true
                      }
                    },
                    {
                      term: {
                        'mx.supports_identification': true
                      }
                    }
                  ]
                }
              },
              {
                bool: {
                  must: [
                    {
                      term: {
                        'sophtron.supports_aggregation': true
                      }
                    },
                    {
                      term: {
                        'sophtron.supports_verification': true
                      }
                    },
                    {
                      term: {
                        'sophtron.supports_identification': true
                      }
                    }
                  ]
                }
              },
              {
                bool: {
                  must: [
                    {
                      term: {
                        'testExample.supports_aggregation': true
                      }
                    },
                    {
                      term: {
                        'testExample.supports_verification': true
                      }
                    },
                    {
                      term: {
                        'testExample.supports_identification': true
                      }
                    }
                  ]
                }
              }
            ]
          }),
          size: 20
        }
      },
      (params) => {
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

    const results = await search('MX Bank', MappedJobTypes.ALL)

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

    const results = await search('nothing', MappedJobTypes.AGGREGATE)

    expect(results).toEqual([])
  })
})

describe('searchByRoutingNumber', () => {
  beforeEach(() => {
    ElasticSearchMock.clearAll()
  })

  it('includes the routing number search query in the request', async () => {
    const routingNumber = '1234567'

    ElasticSearchMock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: searchQuery({ routingNumber }),
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

    const results = await searchByRoutingNumber(
      routingNumber,
      MappedJobTypes.AGGREGATE
    )

    expect(results).toEqual([elasticSearchInstitutionData])
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

    const recommendedInstitutions = await getRecommendedInstitutions(
      MappedJobTypes.AGGREGATE
    )

    expect(recommendedInstitutions).toEqual([elasticSearchInstitutionData])
  })

  it("filters out institutions that don't have available providers because of job type", async () => {
    jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
      supportedProviders: [Providers.MX]
    } as preferences.Preferences)

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
          docs: [
            {
              _source: {
                ...elasticSearchInstitutionData,
                mx: {
                  supports_aggregation: true,
                  supports_oauth: false,
                  supports_identification: false,
                  supports_verification: false,
                  supports_history: false
                }
              }
            }
          ]
        }
      }
    )

    const recommendedInstitutions = await getRecommendedInstitutions(
      MappedJobTypes.AGGREGATE
    )

    expect(recommendedInstitutions).toEqual([])
  })
})
