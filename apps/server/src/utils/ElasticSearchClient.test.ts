import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'

import { elasticSearchInstitutionData } from '../test/testData/institution'
import ElasticsearchClient from '../utils/ElasticSearchClient'

const mock = new Mock()
const client = new Client({
  node: 'http://localhost:9200',
  Connection: mock.getConnection()
})

describe('ElasticSearchClient', () => {
  beforeAll(() => {
    ElasticsearchClient.getInstance(client)
  })

  describe('initialize', () => {
    describe('elastic search already indexed', () => {
      beforeAll(() => {
        mock.add({
          method: 'HEAD',
          path: '/institutions'
        }, () => {
          return ''
        })
      })

      it('does not reindex institutions', async () => {
        await ElasticsearchClient.initialize()
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
          await ElasticsearchClient.initialize()
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

      mock.add({
        method: 'PUT',
        path: '/institutions'
      }, () => {
        indexCreated = true
        return ''
      })

      mock.add({
        method: 'PUT',
        path: '/institutions/_doc/*'
      }, () => {
        institutionsIndexedCount += 1
        return ''
      })
    })

    it('creates a new index and indexes institutions', async () => {
      await ElasticsearchClient.reIndexElasticSearch()
      expect(indexCreated).toBeTruthy()
      expect(institutionsIndexedCount).toBeGreaterThan(4)
    })
  })

  describe('search', () => {
    beforeAll(() => {
      mock.add({
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: {
            multi_match: {
              query: 'nothing',
              fields: ['name', 'keywords']
            }
          }
        }
      }, () => {
        return {
          hits: { hits: [] }
        }
      })

      mock.add({
        method: ['GET', 'POST'],
        path: ['/_search', '/institutions/_search'],
        body: {
          query: {
            multi_match: {
              query: 'MX Bank',
              fields: ['name', 'keywords']
            }
          }
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
    })

    it('makes the expected elasticsearch call and maps the data', async () => {
      const results = await ElasticsearchClient.search('MX Bank')

      expect(results).toEqual([elasticSearchInstitutionData])
    })

    it('calls elasticsearch and doesnt find any institutions', async () => {
      const results = await ElasticsearchClient.search('nothing')

      expect(results).toEqual([])
    })
  })

  describe('getInstitution', () => {
    beforeAll(() => {
      mock.clearAll()

      mock.add({
        method: 'GET',
        path: '/institutions/_doc/UCP-1234'
      }, (params) => {
        return {
          _source: elasticSearchInstitutionData
        }
      })
    })

    it('gets the expected institution response', async () => {
      const institutionResponse = await ElasticsearchClient.getInstitution('UCP-1234')
      expect(institutionResponse).toEqual(elasticSearchInstitutionData)
    })
  })
})
