import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'

import testPreferences from '../../cachedDefaults/testData/testPreferences.json'

import { elasticSearchInstitutionData } from '../test/testData/institution'
import {
  getRecommendedInstitutions,
  getInstitution,
  initialize,
  reIndexElasticSearch,
  search
} from '../utils/ElasticSearchClient'

const mock = new Mock()
const client = new Client({
  node: 'http://localhost:9200',
  Connection: mock.getConnection()
})

describe('initialize', () => {
  describe('elastic search already indexed', () => {
    beforeAll(() => {
      mock.add(
        {
          method: 'HEAD',
          path: '/institutions'
        },
        () => {
          return ''
        }
      )
    })

    it('does not reindex institutions', async () => {
      await initialize(client)
      // this test would fail if it tried to reindex institutions without mocking those methods
    })
  })

  describe('elastic search not indexed', () => {
    beforeAll(() => {
      mock.clearAll()
    })

    it('triggers the reIndexElasticSearch method', async () => {
      // The reindex method triggers 'Mock not found' so we know it's getting to that method, we will test that method
      // separatly from 'initialize'.
      await expect(async () => {
        await initialize(client)
      }).rejects.toThrow('Mock not found')
    })
  })
})

describe('reIndexElasticSearch', () => {
  let indexCreated: boolean
  let institutionsIndexedCount: number

  beforeAll(() => {
    mock.clearAll()
    indexCreated = false
    institutionsIndexedCount = 0

    mock.add(
      {
        method: 'PUT',
        path: '/institutions'
      },
      () => {
        indexCreated = true
        return ''
      }
    )

    mock.add(
      {
        method: 'PUT',
        path: '/institutions/_doc/*'
      },
      () => {
        institutionsIndexedCount += 1
        return ''
      }
    )
  })

  it('creates a new index and indexes institutions', async () => {
    await reIndexElasticSearch(client)
    expect(indexCreated).toBeTruthy()
    expect(institutionsIndexedCount).toBeGreaterThan(4)
  })
})

describe('search', () => {
  it('makes the expected elasticsearch call and maps the data', async () => {
    mock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: {
            bool: {
              must_not: {
                terms: {
                  'ucp_id.keyword': testPreferences.hiddenInstitutions
                }
              },
              should: {
                multi_match: {
                  query: 'MX Bank',
                  fields: ['name', 'keywords']
                }
              }
            }
          }
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

    const results = await search(client, 'MX Bank')

    expect(results).toEqual([elasticSearchInstitutionData])
  })

  it('calls elasticsearch and doesnt find any institutions', async () => {
    mock.add(
      {
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: {
            bool: {
              must_not: {
                terms: {
                  'ucp_id.keyword': testPreferences.hiddenInstitutions
                }
              },
              should: {
                multi_match: {
                  query: 'nothing',
                  fields: ['name', 'keywords']
                }
              }
            }
          }
        }
      },
      () => {
        return {
          hits: { hits: [] }
        }
      }
    )

    const results = await search(client, 'nothing')

    expect(results).toEqual([])
  })
})

describe('getInstitution', () => {
  beforeAll(() => {
    mock.clearAll()

    mock.add(
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
  })

  it('gets the expected institution response', async () => {
    const institutionResponse = await getInstitution(client, 'UCP-1234')
    expect(institutionResponse).toEqual(elasticSearchInstitutionData)
  })
})

describe('getRecommendedInstitutions', () => {
  beforeAll(() => {
    mock.clearAll()

    mock.add(
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
  })

  it('gets a list of recommended institutions', async () => {
    const recommendedInstitutions = await getRecommendedInstitutions(client)

    expect(recommendedInstitutions).toEqual([elasticSearchInstitutionData])
  })
})
