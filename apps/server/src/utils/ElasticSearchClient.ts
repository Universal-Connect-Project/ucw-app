import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config'
import { info } from '../infra/logger'

import type { CachedInstitution } from 'src/shared/contract'

function getInstitutionFilePath () {
  return resolve(__dirname, '../../cachedDefaults/ucwInstitutionsMapping.json')
}

export const ElasticSearchMock = new Mock()

export const ElasticsearchClient = new Client({
  node: config.ELASTIC_SEARCH_URL ?? 'http://localhost:9200',
  ...(process.env.NODE_ENV === 'test' && { Connection: ElasticSearchMock.getConnection() })
})

export async function initialize () {
  const elasticSearchLoaded = await ElasticsearchClient.indices.exists({ index: 'institutions' })
  if (!elasticSearchLoaded) {
    await reIndexElasticSearch()
  } else {
    info('ElasticSearch already indexed')
  }
}

export async function reIndexElasticSearch () {
  try {
    await ElasticsearchClient.indices.delete({
      index: 'institutions'
    })
  } catch {
    info('Elasticsearch "institutions" index did not exist')
  }
  info('Elasticsearch indexing institutions')
  const dataFilePath = getInstitutionFilePath()
  const rawData = readFileSync(dataFilePath)
  const jsonData = JSON.parse(rawData.toString())

  await ElasticsearchClient.indices.create({ index: 'institutions' })

  const indexPromises = jsonData.map(async (institution: { ucp_id: any }) => {
    return await ElasticsearchClient.index({
      index: 'institutions',
      id: institution.ucp_id,
      document: institution
    })
  })

  await Promise.all(indexPromises)
}

export async function search (searchTerm: string): Promise<any[]> {
  const searchResults: estypes.SearchResponseBody = await ElasticsearchClient.search({
    index: 'institutions',
    body: {
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: searchTerm,
                type: 'best_fields',
                fields: ['name', 'keywords'],
                fuzziness: 'AUTO',
                prefix_length: 0,
                max_expansions: 50,
                fuzzy_transpositions: true
              }
            },
            {
              match: {
                'keywords.keyword': {
                  query: searchTerm
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      size: 20
    }
  })
  return searchResults.hits.hits.map((esObject: estypes.SearchHit) => esObject._source)
}

export async function getInstitution (id: string): Promise<CachedInstitution> {
  const institutionResponse = await ElasticsearchClient.get({
    id,
    index: 'institutions'
  })

  return institutionResponse._source as CachedInstitution
}

export async function getFavoriteInstitutions (): Promise<CachedInstitution[]> {
  // Eventually the favorites list will be in the config or something, this is just a placeholder until then
  // to remove the dependency on the institution service hosted by UCP
  const favorites = ['UCP-b087caf69b372c9', 'UCP-60155b7292895ed', 'UCP-ce8334bbb890163', 'UCP-ebca9a2b2ae2cca', 'UCP-b0a4307160ecb4c', 'UCP-8c4ca4c32dbd8de', 'UCP-412ded54698c47f']
  const esSearch = favorites.map(favorite => {
    return {
      _index: 'institutions',
      _id: favorite
    }
  })

  const favoriteInstitutionsResponse: estypes.MgetRequest = await ElasticsearchClient.mget({
    docs: esSearch
  })
  const institutions = favoriteInstitutionsResponse.docs.map(favoriteInstitution => favoriteInstitution._source as CachedInstitution)
  return institutions
}
