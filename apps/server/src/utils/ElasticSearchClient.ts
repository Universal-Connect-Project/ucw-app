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
  if (config.Env === 'test') {
    info('loading test institutions')
    return resolve(
      __dirname,
      '../../cachedDefaults/testData/testInstitutionsMapping.json'
    )
  } else {
    info('loading all institutions into elasticSearch')
    return resolve(
      __dirname,
      '../../cachedDefaults/ucwInstitutionsMapping.json'
    )
  }
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

  for (const institution of jsonData) {
    await ElasticsearchClient.index({
      index: 'institutions',
      id: institution.ucp_id,
      document: institution
    })
  }
}

export async function search(searchTerm: string): Promise<any[]> {
  const hiddenInstitutions = (await getPreferences())?.hiddenInstitutions || []

  const searchResults: estypes.SearchResponseBody =
    await ElasticsearchClient.search({
      index: 'institutions',
      body: {
        query: {
          bool: {
            must_not: {
              terms: {
                'ucp_id.keyword': hiddenInstitutions
              }
            },
            should: {
              multi_match: {
                query: searchTerm,
                fields: ['name', 'keywords']
              }
            }
          }
        }
      }
    })

  const mappedResults = searchResults.hits.hits.map(
    (esObject: estypes.SearchHit) => esObject._source
  )

  return mappedResults
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
