import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config'
import { info } from '../infra/logger'

import { MappedJobTypes, type CachedInstitution } from '../shared/contract'
import { getPreferences, type Provider } from '../shared/preferences'
import { getAvailableProviders } from '../shared/providers'

type JobMappingType = {
  [key in MappedJobTypes]: string[]
}

export const JOB_ES_MAPPING: JobMappingType = {
  [MappedJobTypes.AGGREGATE]: ['supports_aggregation'] as string[],
  [MappedJobTypes.ALL]: [
    'supports_aggregation',
    'supports_verification',
    'supports_identification'
  ] as string[],
  [MappedJobTypes.FULLHISTORY]: ['supports_aggregation'] as string[], // same filter as aggregate
  [MappedJobTypes.VERIFICATION]: ['supports_verification'],
  [MappedJobTypes.IDENTITY]: ['supports_identification']
}

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

export async function searchByRoutingNumber(
  routingNumber: string,
  jobType: MappedJobTypes
): Promise<any[]> {
  const preferences = await getPreferences()
  const hiddenInstitutions = preferences?.hiddenInstitutions || []
  const supportedProviders = preferences?.supportedProviders || []

  const searchResults: estypes.SearchResponseBody =
    await ElasticsearchClient.search({
      index: 'institutions',
      body: {
        query: {
          bool: {
            should: {
              match: {
                routing_numbers: {
                  query: routingNumber
                }
              }
            },
            minimum_should_match: 1,
            must: mustQuery(supportedProviders, jobType),
            must_not: buildMustNotQuery(hiddenInstitutions)
          }
        },
        size: 20
      }
    })

  return searchResults.hits.hits.map(
    (esObject: estypes.SearchHit) => esObject._source
  )
}

export async function search(
  searchTerm: string,
  jobType: MappedJobTypes
): Promise<any[]> {
  const preferences = await getPreferences()
  const hiddenInstitutions = preferences?.hiddenInstitutions || []
  const supportedProviders = preferences?.supportedProviders || []

  const searchResults: estypes.SearchResponseBody =
    await ElasticsearchClient.search({
      index: 'institutions',
      body: {
        query: {
          bool: {
            should: fuzzySearchTermQuery(searchTerm),
            minimum_should_match: 1,
            must: mustQuery(supportedProviders, jobType),
            must_not: buildMustNotQuery(hiddenInstitutions)
          }
        },
        size: 20
      }
    })

  return searchResults.hits.hits.map(
    (esObject: estypes.SearchHit) => esObject._source
  )
}

function fuzzySearchTermQuery(searchTerm: string) {
  return [
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
  ]
}

function mustQuery(supportedProviders: Provider[], jobType: MappedJobTypes) {
  const providerQueryTerms = supportedProviders.map((provider) => {
    return {
      exists: {
        field: `${provider}.id`
      }
    }
  })

  const institutionJobTypeFilter = JOB_ES_MAPPING[jobType]

  let jobTypeSupported = [] as any
  if (institutionJobTypeFilter.length > 0) {
    jobTypeSupported = supportedProviders
      .map((provider) => {
        return {
          bool: {
            must: institutionJobTypeFilter.map((jobTypeFilter) => {
              return {
                term: {
                  [`${provider}.${jobTypeFilter}`]: true
                }
              }
            })
          }
        }
      })
      .flat()
  }

  return {
    bool: {
      should: providerQueryTerms,
      minimum_should_match: 1,
      must: {
        bool: {
          should: jobTypeSupported,
          minimum_should_match: 1
        }
      }
    }
  }
}

function buildMustNotQuery(hiddenInstitutions: string[]): any[] {
  const mustNotClauses = []

  mustNotClauses.push({
    terms: {
      'ucp_id.keyword': hiddenInstitutions
    }
  })

  if (!['test', 'dev'].includes(config.Env)) {
    mustNotClauses.push({
      term: {
        is_test_bank: true
      }
    })
  }

  return mustNotClauses
}

export async function getInstitution(id: string): Promise<CachedInstitution> {
  const institutionResponse = await ElasticsearchClient.get({
    id,
    index: 'institutions'
  })

  return institutionResponse._source as CachedInstitution
}

export async function getRecommendedInstitutions(
  jobType: MappedJobTypes
): Promise<CachedInstitution[]> {
  const preferences = await getPreferences()

  const supportedProviders = preferences.supportedProviders
  const recommendedInstitutions = preferences?.recommendedInstitutions

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

  const institutions = recommendedInstitutionsResponse.docs
    .map(
      (favoriteInstitution) => favoriteInstitution._source as CachedInstitution
    )
    .filter(
      (institution) =>
        getAvailableProviders(institution, jobType, supportedProviders).length
    )

  return institutions
}
