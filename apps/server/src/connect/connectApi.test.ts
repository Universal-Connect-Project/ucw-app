import { elasticSearchInstitutionData } from '../test/testData/institution'
import ElasticsearchClient from '../utils/ElasticSearchClient'
import { ConnectApi } from './connectApi'

import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'

const mock = new Mock()
const client = new Client({
  node: 'http://localhost:9200',
  Connection: mock.getConnection()
})

const connectApi = new ConnectApi({
  context: {
    provider: 'mx',
    updated: false,
    institution_id: 'xxx',
    resolved_user_id: null
  }
})

describe('loadInstitutions', () => {
  beforeAll(() => {
    ElasticsearchClient.getInstance(client)

    mock.add({
      method: ['GET', 'POST'],
      path: ['/_search', '/institutions/_search'],
      body: {
        query: {
          multi_match: {
            query: 'MX',
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
            },
            {
              _source: elasticSearchInstitutionData
            }
          ]
        }
      }
    })
  })

  const expectedInstitutionList = [
    {
      guid: 'UCP-da107e6d0da7779',
      name: 'MX Bank (Oauth)',
      url: 'https://mx.com',
      logo_url: 'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
      supports_oauth: true
    },
    {
      guid: 'UCP-da107e6d0da7779',
      name: 'MX Bank (Oauth)',
      url: 'https://mx.com',
      logo_url: 'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
      supports_oauth: true
    }
  ]

  it('loads formatted institutions', async () => {
    const institutions = await connectApi.loadInstitutions('MX')

    expect(institutions).toEqual(expectedInstitutionList)
  })
})

describe('loadInstitutionByUcpId', () => {
  beforeAll(() => {
    mock.clearAll()

    mock.add({
      method: 'GET',
      path: '/institutions/_doc/UCP-1234'
    }, () => {
      return {
        _source: elasticSearchInstitutionData
      }
    })
  })

  const expectedInstitutionResponse = {
    institution: {
      guid: 'testCode',
      code: 'testCode',
      name: 'MX Bank (Oauth)',
      url: 'https://mx.com',
      logo_url: 'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
      instructional_data: {
      },
      credentials: [
      ] as any[],
      supports_oauth: true,
      providers: undefined as any,
      provider: 'mx_int'
    }
  }

  it('finds the institution', async () => {
    const institution = await connectApi.loadInstitutionByUcpId('UCP-1234')
    expect(institution).toEqual(expectedInstitutionResponse)
  })
})

describe('loadPopularInstitutions', () => {
  beforeAll(() => {
    mock.clearAll()

    mock.add({
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

  const expectedPopularInstitutionResponse = [{
    guid: 'UCP-da107e6d0da7779',
    name: 'MX Bank (Oauth)',
    url: 'https://mx.com',
    logo_url: 'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
    supports_oauth: true
  }]

  it('gets the popular institution list', async () => {
    const popularInstitutionList = await connectApi.loadPopularInstitutions()

    expect(popularInstitutionList).toEqual(expectedPopularInstitutionResponse)
  })
})
