import type { estypes } from "@elastic/elasticsearch";
import { Client } from "@elastic/elasticsearch";
import { readFileSync } from "fs";
import { resolve } from "path";

import config, { getConfig } from "../config";
import { info, error as logError } from "../infra/logger";
import type {
  CachedInstitution,
  MappedJobTypes,
  Aggregator,
} from "../shared/contract";
import { getPreferences } from "../shared/preferences";
import {
  getAvailableAggregators,
  JOB_TYPE_PARTIAL_SUPPORT_MAP,
} from "../shared/aggregators";
import { ElasticSearchMock } from "../test/elasticSearchMock";
import { fetchInstitutions } from "./institutionSyncer";
import { INSTITUTION_CURRENT_LIST_IDS } from "./storageClient/constants";
import { getSet, overwriteSet } from "./storageClient/redis";

export function getInstitutionFilePath() {
  return resolve(__dirname, "../../cachedDefaults/ucwInstitutionsMapping.json");
}

export const ElasticsearchClient = new Client({
  node: config.ELASTIC_SEARCH_URL ?? "http://localhost:9200",
  ...(process.env.NODE_ENV === "test" && {
    Connection: ElasticSearchMock.getConnection(),
  }),
});

export async function initialize() {
  const elasticSearchLoaded = await ElasticsearchClient.indices.exists({
    index: "institutions",
  });
  if (!elasticSearchLoaded) {
    await indexElasticSearch();
  } else {
    info("ElasticSearch already indexed");
  }
}

export async function indexElasticSearch() {
  const institutionData = await getInstitutions();
  const insIds = institutionData.map((ins: CachedInstitution) => ins.id);

  await overwriteSet(INSTITUTION_CURRENT_LIST_IDS, insIds);

  await ElasticsearchClient.indices.create({ index: "institutions" });

  const indexPromises = institutionData.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (institution: { id: any }) => {
      return await ElasticsearchClient.index({
        index: "institutions",
        id: institution.id,
        document: institution,
      });
    },
  );

  await Promise.all(indexPromises);
}

async function getInstitutions(): Promise<CachedInstitution[]> {
  const response = await fetchInstitutions();
  if (response?.ok) {
    info("Elasticsearch indexing from server list");
    let newInstitutions;
    try {
      newInstitutions = await response.json();
    } catch {
      newInstitutions = null;
    }
    if (newInstitutions?.length > 0) {
      info("Updating institution cache list");
      return newInstitutions;
    } else {
      return getInstitutionDataFromFile();
    }
  } else {
    return getInstitutionDataFromFile();
  }
}

function getInstitutionDataFromFile(): CachedInstitution[] {
  info("Elasticsearch indexing from local file");
  const dataFilePath = getInstitutionFilePath();
  const rawData = readFileSync(dataFilePath);
  return JSON.parse(rawData.toString());
}

export async function searchByRoutingNumber(
  routingNumber: string,
  jobType: MappedJobTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const preferences = await getPreferences();
  const hiddenInstitutions = preferences?.hiddenInstitutions || [];
  const supportedAggregators = preferences?.supportedAggregators || [];

  const searchResults: estypes.SearchResponseBody =
    await ElasticsearchClient.search({
      index: "institutions",
      body: {
        query: {
          bool: {
            should: {
              match: {
                routing_numbers: {
                  query: routingNumber,
                },
              },
            },
            minimum_should_match: 1,
            must: mustQuery(supportedAggregators, jobType),
            must_not: buildMustNotQuery(hiddenInstitutions),
          },
        },
        size: 20,
      },
    });

  return searchResults.hits.hits.map(
    (esObject: estypes.SearchHit) => esObject._source,
  );
}

export async function search(
  searchTerm: string,
  jobType: MappedJobTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const preferences = await getPreferences();
  const hiddenInstitutions = preferences?.hiddenInstitutions || [];
  const supportedAggregators = preferences?.supportedAggregators || [];

  const searchResults: estypes.SearchResponseBody =
    await ElasticsearchClient.search({
      index: "institutions",
      body: {
        query: {
          bool: {
            should: fuzzySearchTermQuery(searchTerm),
            minimum_should_match: 1,
            must: mustQuery(supportedAggregators, jobType),
            must_not: buildMustNotQuery(hiddenInstitutions),
          },
        },
        size: 20,
      },
    });

  return searchResults.hits.hits.map(
    (esObject: estypes.SearchHit) => esObject._source,
  );
}

function fuzzySearchTermQuery(searchTerm: string) {
  return [
    {
      match: {
        name: {
          query: searchTerm,
          boost: 1.5,
        },
      },
    },
    {
      match: {
        keywords: {
          query: searchTerm,
          boost: 1.4,
        },
      },
    },
    {
      fuzzy: {
        name: {
          value: searchTerm.toLowerCase(),
          fuzziness: "AUTO",
          boost: 1,
          max_expansions: 50,
        },
      },
    },
    {
      wildcard: {
        name: {
          value: `${searchTerm}*`,
          boost: 0.8,
        },
      },
    },
  ];
}

function mustQuery(
  supportedAggregators: Aggregator[],
  jobType: MappedJobTypes,
) {
  const aggregatorQueryTerms = supportedAggregators.map((aggregator) => {
    return {
      exists: {
        field: `${aggregator}.id`,
      },
    };
  });

  const institutionJobTypeFilter = JOB_TYPE_PARTIAL_SUPPORT_MAP[jobType];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jobTypeSupported = [] as any;
  if (institutionJobTypeFilter.length > 0) {
    jobTypeSupported = supportedAggregators
      .map((aggregator) => {
        return {
          bool: {
            must: institutionJobTypeFilter.map((jobTypeFilter) => {
              return {
                term: {
                  [`${aggregator}.${jobTypeFilter}`]: true,
                },
              };
            }),
          },
        };
      })
      .flat();
  }

  return {
    bool: {
      should: aggregatorQueryTerms,
      minimum_should_match: 1,
      must: {
        bool: {
          should: jobTypeSupported,
          minimum_should_match: 1,
        },
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMustNotQuery(hiddenInstitutions: string[]): any[] {
  const mustNotClauses = [];

  mustNotClauses.push({
    terms: {
      "id.keyword": hiddenInstitutions,
    },
  });

  if (!["test", "dev"].includes(config.ENV)) {
    mustNotClauses.push({
      term: {
        is_test_bank: true,
      },
    });
  }

  return mustNotClauses;
}

export async function getInstitution(id: string): Promise<CachedInstitution> {
  const institutionResponse = await ElasticsearchClient.get({
    id,
    index: "institutions",
  });

  return institutionResponse._source as CachedInstitution;
}

export async function getRecommendedInstitutions(args: {
  jobType: MappedJobTypes;
}): Promise<CachedInstitution[]> {
  const config = getConfig();
  const { jobType } = args;
  const preferences = await getPreferences();

  const supportedAggregators = preferences.supportedAggregators;
  const recommendedInstitutions = preferences?.recommendedInstitutions;

  if (!recommendedInstitutions) {
    return [];
  }

  info(
    "Getting recommended institutions",
    JSON.stringify(recommendedInstitutions),
  );

  const esSearch = recommendedInstitutions.map((recommendedInstitution) => {
    return {
      _index: "institutions",
      _id: recommendedInstitution,
    };
  });

  const recommendedInstitutionsResponse: estypes.MgetRequest =
    await ElasticsearchClient.mget({
      docs: esSearch,
    });

  return recommendedInstitutionsResponse.docs
    .filter(({ _source }) => _source)
    .map(
      (favoriteInstitution) => favoriteInstitution._source as CachedInstitution,
    )
    .filter((institution: CachedInstitution) =>
      config.ENV === "prod" ? !institution.is_test_bank : true,
    )
    .filter(
      (institution: CachedInstitution) =>
        getAvailableAggregators({
          institution,
          jobType,
          shouldRequireFullSupport: false,
          supportedAggregators: supportedAggregators,
        }).length,
    );
}

export async function deleteRemovedInstitutions(
  newInstitutions: CachedInstitution[],
) {
  const newInsIdsSet = new Set(
    newInstitutions.map((ins: CachedInstitution) => ins.id),
  );

  const oldInsIds = await getSet(INSTITUTION_CURRENT_LIST_IDS);

  const deletedInstitutionsIds = oldInsIds.filter(
    (ucpId: string) => !newInsIdsSet.has(ucpId),
  );

  if (deletedInstitutionsIds.length === 0) {
    return;
  }
  info("deleting institutions", deletedInstitutionsIds);
  const deletePromises = deletedInstitutionsIds.map(async (ucpId: string) => {
    return await ElasticsearchClient.delete({
      index: "institutions",
      id: ucpId,
    });
  });

  try {
    await Promise.all(deletePromises);
    await overwriteSet(INSTITUTION_CURRENT_LIST_IDS, Array.from(newInsIdsSet));
  } catch (error) {
    logError(error);
  }
}

export async function updateInstitutions(institutions: CachedInstitution[]) {
  const updatePromises = institutions.map(
    async (institution: CachedInstitution) => {
      return await ElasticsearchClient.update({
        index: "institutions",
        id: institution.id,
        doc: institution,
        doc_as_upsert: true,
      });
    },
  );
  await Promise.all(updatePromises);
}
