import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config'

import type { CachedInstitution } from 'src/shared/contract'
import { getPreferences } from '../shared/preferences'

function getInstitutionFilePath() {
  if (config.Env === 'test') {
    return resolve(
      __dirname,
      '../../cachedDefaults/testData/testInstitutionsMapping.json'
    )
  } else {
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

export async function initialize(client: Client) {
  const elasticSearchLoaded = await client.indices.exists({
    index: 'institutions'
  })
  if (!elasticSearchLoaded) {
    await reIndexElasticSearch(client)
  }
}

export async function reIndexElasticSearch(client: Client) {
  try {
    await client.indices.delete({
      index: 'institutions'
    })
  } catch {}
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

export async function search(
  client: Client,
  searchTerm: string
): Promise<any[]> {
  const hiddenInstitutions = (await getPreferences())?.hiddenInstitutions || []

  const searchResults: estypes.SearchResponseBody = await client.search({
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

export async function getInstitution(
  client: Client,
  id: string
): Promise<CachedInstitution> {
  const institutionResponse = await client.get({
    id,
    index: 'institutions'
  })

  return institutionResponse._source as CachedInstitution
}

export async function getRecommendedInstitutions(
  client: Client
): Promise<CachedInstitution[]> {
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
    await client.mget({
      docs: esSearch
    })
  const institutions = recommendedInstitutionsResponse.docs.map(
    (recommendedInstitution) =>
      recommendedInstitution._source as CachedInstitution
  )
  return institutions
}
