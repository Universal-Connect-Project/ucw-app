import { Client } from "@opensearch-project/opensearch";
import type { CachedInstitution, ComboJobTypes } from "@repo/utils";
import type {
  MgetRequest,
  SearchHit,
  SearchResponse,
} from "@opensearch-project/opensearch/api/types";
import { readFileSync } from "fs";
import { resolve } from "path";

import config, { getConfig } from "../config";
import { ElasticSearchMock } from "../test/elasticSearchMock";

import { info, error as logError } from "../infra/logger";
import {
  getAvailableAggregators,
  JobTypesPartialSupportsMap,
} from "../shared/aggregators";
import type { Aggregator } from "../shared/contract";
import { getPreferences } from "../shared/preferences";
import { fetchInstitutions } from "./institutionSyncer";
import { INSTITUTION_CURRENT_LIST_IDS } from "./storageClient/constants";
import { getSet, overwriteSet } from "./storageClient/redis";
import { addTestInstitutions } from "../testInstitutions/testInstitutions";

function getInstitutionFilePath() {
  return resolve(__dirname, "../../cachedDefaults/ucwInstitutionsMapping.json");
}

export const ElasticsearchClient = new Client({
  node: config.ELASTIC_SEARCH_URL ?? "http://localhost:9200",
  ssl: {
    rejectUnauthorized: false,
  },
  ...(process.env.NODE_ENV === "test" && {
    Connection: ElasticSearchMock.getConnection(),
  }),
});

export async function initialize() {
  try {
    const { body: exists } = await ElasticsearchClient.indices.exists({
      index: "institutions",
    });

    if (!exists) {
      info("ElasticSearch is indexing");
      await indexElasticSearch();
    } else {
      info("ElasticSearch already indexed");
    }
  } catch (error) {
    logError(error);
  }
}

export async function indexElasticSearch() {
  const institutionData = await getInstitutions();
  const insIds = institutionData.map((ins: CachedInstitution) => ins.id);

  await overwriteSet(INSTITUTION_CURRENT_LIST_IDS, insIds);

  await ElasticsearchClient.indices.create({ index: "institutions" });

  info(`Indexing ${institutionData.length} documents`);

  async function indexDocument(institution: CachedInstitution) {
    await ElasticsearchClient.index({
      index: "institutions",
      id: institution.id,
      body: institution,
    });
  }

  if (config.ELASTIC_SEARCH_SINGLE_THREAD) {
    for (let i = 0; i < institutionData.length; i++) {
      await indexDocument(institutionData[i]);
    }
  } else {
    await Promise.all(
      institutionData.map((institution) => indexDocument(institution)),
    );
  }

  info("Indexing complete!");
}

async function getInstitutions(): Promise<CachedInstitution[]> {
  const response = await fetchInstitutions();

  let newInstitutions;

  if (response?.ok) {
    info("Elasticsearch indexing from server list");
    try {
      newInstitutions = await response.json();
    } catch {
      newInstitutions = null;
    }
    if (newInstitutions?.length > 0) {
      info("Updating institution cache list");
    } else {
      newInstitutions = getInstitutionDataFromFile();
    }
  } else {
    newInstitutions = getInstitutionDataFromFile();
  }

  return addTestInstitutions(newInstitutions);
}

function getInstitutionDataFromFile(): CachedInstitution[] {
  info("Elasticsearch indexing from local file");
  const dataFilePath = getInstitutionFilePath();
  const rawData = readFileSync(dataFilePath);
  return JSON.parse(rawData.toString());
}

export async function searchByRoutingNumber(
  {
    from,
    jobTypes,
    routingNumber,
    size,
  }: {
    from: number;
    jobTypes: ComboJobTypes[];
    routingNumber: string;
    size: number;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const preferences = await getPreferences();
  const hiddenInstitutions = preferences?.hiddenInstitutions || [];
  const supportedAggregators = preferences?.supportedAggregators || [];

  const { body }: { body: SearchResponse } = await ElasticsearchClient.search({
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
          must: mustQuery(supportedAggregators, jobTypes),
          must_not: buildMustNotQuery(hiddenInstitutions),
        },
      },
      from,
      size,
    },
  });

  return body.hits.hits.map((esObject: SearchHit) => esObject._source);
}

export async function search(
  {
    from,
    jobTypes,
    searchTerm,
    size,
  }: {
    from: number;
    jobTypes: ComboJobTypes[];
    searchTerm: string;
    size: number;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const preferences = await getPreferences();
  const hiddenInstitutions = preferences?.hiddenInstitutions || [];
  const supportedAggregators = preferences?.supportedAggregators || [];
  const { body }: { body: SearchResponse } = await ElasticsearchClient.search({
    index: "institutions",
    body: {
      query: {
        bool: {
          should: fuzzySearchTermQuery(searchTerm),
          minimum_should_match: 1,
          must: mustQuery(supportedAggregators, jobTypes),
          must_not: buildMustNotQuery(hiddenInstitutions),
        },
      },
      from,
      size,
    },
  });

  return body.hits.hits.map((esObject: SearchHit) => esObject._source);
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
  jobTypes: ComboJobTypes[],
) {
  const aggregatorQueryTerms = supportedAggregators.map((aggregator) => {
    return {
      exists: {
        field: `${aggregator}.id`,
      },
    };
  });

  const institutionJobTypeFilter = jobTypes.map(
    (jobType) => JobTypesPartialSupportsMap[jobType],
  );

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

  if (config.ENV === "prod") {
    mustNotClauses.push({
      term: {
        is_test_bank: true,
      },
    });
  }

  return mustNotClauses;
}

export async function getInstitution(id: string): Promise<CachedInstitution> {
  const { body } = await ElasticsearchClient.get({
    id,
    index: "institutions",
  });

  return body._source as CachedInstitution;
}

export async function getRecommendedInstitutions({
  jobTypes,
}: {
  jobTypes: ComboJobTypes[];
}): Promise<CachedInstitution[]> {
  const config = getConfig();
  const preferences = await getPreferences();

  const supportedAggregators = preferences.supportedAggregators;
  const recommendedInstitutions = preferences?.recommendedInstitutions;

  if (!recommendedInstitutions?.length) {
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

  try {
    const { body }: MgetRequest = await ElasticsearchClient.mget({
      body: { docs: esSearch },
    });

    return body.docs
      .filter(({ _source }) => _source)
      .map(
        (favoriteInstitution) =>
          favoriteInstitution._source as CachedInstitution,
      )
      .filter((institution: CachedInstitution) =>
        config.ENV === "prod" ? !institution.is_test_bank : true,
      )
      .filter(
        (institution: CachedInstitution) =>
          getAvailableAggregators({
            institution,
            jobTypes,
            shouldRequireFullSupport: false,
            supportedAggregators: supportedAggregators,
          }).length,
      );
  } catch (error) {
    logError(error);
  }
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

  info("Deleting institutions", deletedInstitutionsIds);

  async function deleteInstitution(ucpId: string) {
    await ElasticsearchClient.delete({
      index: "institutions",
      id: ucpId,
    });
    console.info(`Deleted institution ${ucpId}`);
  }

  try {
    if (config.ELASTIC_SEARCH_SINGLE_THREAD) {
      for (const ucpId of deletedInstitutionsIds) {
        await deleteInstitution(ucpId);
      }
    } else {
      await Promise.all(deletedInstitutionsIds.map(deleteInstitution));
    }

    await overwriteSet(INSTITUTION_CURRENT_LIST_IDS, Array.from(newInsIdsSet));
  } catch (error) {
    logError(error);
  }
}

export async function updateInstitutions(institutions: CachedInstitution[]) {
  async function updateInstitution(institution: CachedInstitution) {
    await ElasticsearchClient.update({
      index: "institutions",
      id: institution.id,
      body: {
        doc: institution,
        doc_as_upsert: true,
      },
    });
    console.info(`Updated institution ${institution.id}`);
  }

  if (config.ELASTIC_SEARCH_SINGLE_THREAD) {
    for (const institution of institutions) {
      await updateInstitution(institution);
    }
  } else {
    const updatePromises = institutions.map(updateInstitution);
    await Promise.all(updatePromises);
  }
}
