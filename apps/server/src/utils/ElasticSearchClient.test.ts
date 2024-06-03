import { elasticSearchInstitutionData } from '../test/testData/institution'
import { ElasticSearchMock, getFavoriteInstitutions, getInstitution, initialize, reIndexElasticSearch, search } from '../utils/ElasticSearchClient'

describe('initialize', () => {
  describe('elastic search already indexed', () => {
    beforeAll(() => {
      ElasticSearchMock.add({
        method: 'HEAD',
        path: '/institutions'
      }, () => {
        return ''
      })
    })

    it('does not reindex institutions', async () => {
      await initialize()
      // this test would fail if it tried to reindex institutions without mocking those methods
    })
  })

  describe('elastic search not indexed', () => {
    beforeAll(() => {
      ElasticSearchMock.clearAll()
    })

    it('triggers the reIndexElasticSearch method', async () => {
      // The reindex method triggers 'Mock not found' so we know it's getting to that method, we will test that method
      // separatly from 'initialize'.
      await expect(async () => {
        await initialize()
      }).rejects.toThrow('Mock not found')
    })
  })
})

describe('reIndexElasticSearch', () => {
  let indexCreated: boolean
  let institutionsIndexedCount: number

  beforeAll(() => {
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
  })

  it('creates a new index and indexes institutions', async () => {
    await reIndexElasticSearch()
    expect(indexCreated).toBeTruthy()
    expect(institutionsIndexedCount).toBeGreaterThan(4)
  })
})

describe('search', () => {
  beforeEach(() => {
    ElasticSearchMock.clearAll()
    ElasticSearchMock.add({
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

    ElasticSearchMock.add({
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
    const results = await search('MX Bank')

    expect(results).toEqual([elasticSearchInstitutionData])
  })

  it('calls elasticsearch and doesnt find any institutions', async () => {
    const results = await search('nothing')

    expect(results).toEqual([])
  })
})

describe('getInstitution', () => {
  beforeEach(() => {
    ElasticSearchMock.clearAll()

    ElasticSearchMock.add({
      method: 'GET',
      path: '/institutions/_doc/UCP-1234'
    }, (params) => {
      return {
        _source: elasticSearchInstitutionData
      }
    })
  })

  it('gets the expected institution response', async () => {
    const institutionResponse = await getInstitution('UCP-1234')
    expect(institutionResponse).toEqual(elasticSearchInstitutionData)
  })
})

describe('getFavoriteInstitutions', () => {
  beforeAll(() => {
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
  })

  it('gets a list of favorite institutions', async () => {
    const favoriteInsitutions = await getFavoriteInstitutions()

    expect(favoriteInsitutions).toEqual([elasticSearchInstitutionData])
  })
})
