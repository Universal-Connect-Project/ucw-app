import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config'
import { info } from '../infra/logger'

import type { CachedInstitution } from 'src/shared/contract'
import { getPreferences } from '../shared/preferences'

function getInstitutionFilePath() {
  return resolve(__dirname, '../../cachedDefaults/ucwInstitutionsMapping.json')
}

export const ElasticSearchMock = new Mock()

export const ElasticsearchClient = new Client({
  node: config.ELASTIC_SEARCH_URL ?? 'http://localhost:9200',
  ...(process.env.NODE_ENV === 'test' && {
    Connection: ElasticSearchMock.getConnection()
  })
})

export async function initialize() {
  const elasticSearchLoaded = await ElasticsearchClient.indices.exists({
    index: 'institutions'
  })
  if (!elasticSearchLoaded) {
    await reIndexElasticSearch()
  } else {
    info('ElasticSearch already indexed')
  }
}

export async function reIndexElasticSearch() {
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

export async function search(searchTerm: string): Promise<any[]> {
  const hiddenInstitutions = (await getPreferences())?.hiddenInstitutions || []

  const searchResults: estypes.SearchResponseBody =
    await ElasticsearchClient.search({
      index: 'institutions',
      body: {
        query: {
          bool: {
            should: [
              {
                match: {
                  name: {
                    query: searchTerm,
                    boost: 1.5
                  }
                }
              },
              {
                match: {
                  keywords: {
                    query: searchTerm,
                    boost: 1.4
                  }
                }
              },
              {
                fuzzy: {
                  name: {
                    value: searchTerm.toLowerCase(),
                    fuzziness: 'AUTO',
                    boost: 1,
                    max_expansions: 50
                  }
                }
              },
              {
                wildcard: {
                  name: {
                    value: `${searchTerm}*`,
                    boost: 0.8
                  }
                }
              }
            ],
            minimum_should_match: 1,
            must_not: {
              terms: {
                'ucp_id.keyword': hiddenInstitutions
              }
            }
          }
        },
        size: 20
      }
    })

  return searchResults.hits.hits.map(
    (esObject: estypes.SearchHit) => esObject._source
  )
}

export async function getInstitution(id: string): Promise<CachedInstitution> {
  const institutionResponse = await ElasticsearchClient.get({
    id,
    index: 'institutions'
  })

  return institutionResponse._source as CachedInstitution
}

export async function getRecommendedInstitutions(): Promise<
CachedInstitution[]
> {
  const recommendedInstitutions = (await getPreferences())
    ?.recommendedInstitutions

  if (!recommendedInstitutions) {
    return []
  }

  const esSearch = recommendedInstitutions.map((recommendedInstitution) => {
    return {
      _index: 'institutions',
      _id: recommendedInstitution
    }
  })

  const recommendedInstitutionsResponse: estypes.MgetRequest =
    await ElasticsearchClient.mget({
      docs: esSearch
    })
  const institutions = recommendedInstitutionsResponse.docs.map(
    (favoriteInstitution) => favoriteInstitution._source as CachedInstitution
  )

  return institutions
}
