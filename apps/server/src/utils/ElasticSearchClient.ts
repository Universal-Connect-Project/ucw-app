import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config'

import type { CachedInstitution } from 'src/shared/contract'

function getInstitutionFilePath () {
  if (config.Env === 'test') {
    console.log('loading test institutions')
    return resolve(__dirname, '../../cachedDefaults/testInstitutionsMapping.json')
  } else {
    console.log('loading all institutions into elasticSearch')
    return resolve(__dirname, '../../cachedDefaults/ucwInstitutionsMapping.json')
  }
}

export const ElasticSearchMock = new Mock()

export const ElasticsearchClient = new Client({
  node: config.ELASTIC_SEARCH_URL ?? 'http://localhost:9200',
  ...(process.env.NODE_ENV === 'test' && { Connection: ElasticSearchMock.getConnection() })
})

export async function initialize (client: Client) {
  const elasticSearchLoaded = await client.indices.exists({ index: 'institutions' })
  if (!elasticSearchLoaded) {
    await reIndexElasticSearch(client)
  } else {
    console.log('ElasticSearch already indexed')
  }
}

export async function reIndexElasticSearch (client: Client) {
  try {
    await client.indices.delete({
      index: 'institutions'
    })
  } catch {
    console.log('Elasticsearch "institutions" index did not exist')
  }
  console.log('Elasticsearch indexing institutions')
  const dataFilePath = getInstitutionFilePath()
  const rawData = readFileSync(dataFilePath)
  const jsonData = JSON.parse(rawData.toString())

  await client.indices.create({ index: 'institutions' })

  for (const institution of jsonData) {
    await client.index({
      index: 'institutions',
      id: institution.ucp_id,
      document: institution
    })
  }
}

export async function search (client: Client, searchTerm: string): Promise<any[]> {
  const searchResults: estypes.SearchResponseBody = await client.search({
    index: 'institutions',
    body: {
      query: {
        multi_match: {
          query: searchTerm,
          fields: ['name', 'keywords']
        }
      }
    }
  })
  return searchResults.hits.hits.map((esObject: estypes.SearchHit) => esObject._source)
}

export async function getInstitution (client: Client, id: string): Promise<CachedInstitution> {
  const institutionResponse = await client.get({
    id,
    index: 'institutions'
  })

  return institutionResponse._source as CachedInstitution
}

export async function getFavoriteInstitutions (client: Client): Promise<CachedInstitution[]> {
  // Eventually the favorites list will be in the config or something, this is just a placeholder until then
  // to remove the dependency on the institution service hosted by UCP
  const favorites = ['UCP-b087caf69b372c9', 'UCP-60155b7292895ed', 'UCP-ce8334bbb890163', 'UCP-ebca9a2b2ae2cca', 'UCP-b0a4307160ecb4c', 'UCP-8c4ca4c32dbd8de', 'UCP-412ded54698c47f']
  const esSearch = favorites.map(favorite => {
    return {
      _index: 'institutions',
      _id: favorite
    }
  })

  const favoriteInstitutionsResponse: estypes.MgetRequest = await client.mget({
    docs: esSearch
  })
  const institutions = favoriteInstitutionsResponse.docs.map(favoriteInstitution => favoriteInstitution._source as CachedInstitution)
  return institutions
}
