import * as fs from "fs";
import { http, HttpResponse } from "msw";

import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import config from "../config";
import * as logger from "../infra/logger";
import {
  deleteRemovedInstitutions,
  getInstitution,
  getRecommendedInstitutions,
  indexElasticSearch,
  initialize,
  search,
  searchByRoutingNumber,
  updateInstitutions,
} from "../services/ElasticSearchClient";
import type { CachedInstitution } from "../shared/contract";
import { MappedJobTypes } from "../shared/contract";
import * as preferences from "../shared/preferences";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import {
  ElasticSearchMock,
  elasticSearchMockError,
} from "../test/elasticSearchMock";
import {
  elasticSearchInstitutionData,
  elasticSearchInstitutionDataFavs,
} from "../test/testData/institution";
import { server } from "../test/testServer";
import { INSTITUTION_CURRENT_LIST_IDS } from "./storageClient/constants";
import { overwriteSet } from "./storageClient/redis";

jest.mock("fs");

jest
  .spyOn(preferences, "getPreferences")
  .mockResolvedValue(testPreferences as preferences.Preferences);

interface searchQueryArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobTypeQuery?: any[];
  filterTestBanks?: boolean;
  routingNumber?: string;
}

function searchQuery(args: searchQueryArgs = {}) {
  const {
    jobTypeQuery = testPreferences.supportedAggregators.map((aggregator) => ({
      bool: {
        must: [
          {
            term: {
              [`${aggregator}.supports_aggregation`]: true,
            },
          },
        ],
      },
    })),
    filterTestBanks = false,
    routingNumber,
  } = args;

  let mainSearchTerm;
  if (routingNumber) {
    mainSearchTerm = {
      match: {
        routing_numbers: {
          query: routingNumber,
        },
      },
    };
  } else {
    mainSearchTerm = [
      {
        match: {
          name: {
            query: "MX Bank",
            boost: 1.5,
          },
        },
      },
      {
        match: {
          keywords: {
            query: "MX Bank",
            boost: 1.4,
          },
        },
      },
      {
        fuzzy: {
          name: {
            value: "mx bank",
            fuzziness: "AUTO",
            boost: 1,
            max_expansions: 50,
          },
        },
      },
      {
        wildcard: {
          name: {
            value: "MX Bank*",
            boost: 0.8,
          },
        },
      },
    ];
  }

  return {
    bool: {
      should: mainSearchTerm,
      minimum_should_match: 1,
      must: {
        bool: {
          should: testPreferences.supportedAggregators.map((aggregator) => ({
            exists: {
              field: `${aggregator}.id`,
            },
          })),
          minimum_should_match: 1,
          must: {
            bool: {
              should: jobTypeQuery,
              minimum_should_match: 1,
            },
          },
        },
      },
      must_not: [
        {
          terms: {
            "id.keyword": testPreferences.hiddenInstitutions,
          },
        },
        ...(filterTestBanks
          ? [
              {
                term: {
                  is_test_bank: true,
                },
              },
            ]
          : []),
      ],
    },
  };
}

describe("initialize", () => {
  it("does not reindex institutions when the index already exists", async () => {
    let indexCreated: boolean = false;
    ElasticSearchMock.clearAll();
    ElasticSearchMock.add(
      {
        method: "HEAD",
        path: "/institutions",
      },
      () => {
        return "";
      },
    );

    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions",
      },
      () => {
        indexCreated = true;
        return "";
      },
    );

    await initialize();
    expect(indexCreated).toBeFalsy();
  });

  it("triggers the indexElasticSearch method and creates an index if ES not already indexed", async () => {
    let indexCreated: boolean;
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify([elasticSearchInstitutionData]));

    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () => HttpResponse.error()),
    );

    ElasticSearchMock.clearAll();
    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions",
      },
      () => {
        indexCreated = true;
        return "";
      },
    );

    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions/_doc/*",
      },
      () => {
        return "";
      },
    );

    await initialize();
    expect(indexCreated).toBeTruthy();
  });
});

describe("indexElasticSearch", () => {
  let indexCreated: boolean;
  let institutionsIndexedCount: number;

  it("makes call to create index and makes call to index 3 institutions retrieved from the local cache file because the institution cache list server is unavailable", async () => {
    ElasticSearchMock.clearAll();

    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () => HttpResponse.error()),
    );

    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        JSON.stringify([
          elasticSearchInstitutionData,
          elasticSearchInstitutionData,
          elasticSearchInstitutionData,
        ]),
      );

    indexCreated = false;
    institutionsIndexedCount = 0;

    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions",
      },
      () => {
        indexCreated = true;
        return "";
      },
    );

    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions/_doc/*",
      },
      () => {
        institutionsIndexedCount += 1;
        return "";
      },
    );

    await indexElasticSearch();
    expect(indexCreated).toBeTruthy();
    expect(institutionsIndexedCount).toEqual(3);
  });

  it("it indexes institutions retrieved from the institution server", async () => {
    ElasticSearchMock.clearAll();

    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () => {
        return HttpResponse.json([
          elasticSearchInstitutionData,
          elasticSearchInstitutionData,
        ]);
      }),
    );

    institutionsIndexedCount = 0;
    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions",
      },
      () => {
        indexCreated = true;
        return "";
      },
    );

    ElasticSearchMock.add(
      {
        method: "PUT",
        path: "/institutions/_doc/*",
      },
      () => {
        institutionsIndexedCount += 1;
        return "";
      },
    );

    await indexElasticSearch();
    expect(indexCreated).toBeTruthy();
    expect(institutionsIndexedCount).toEqual(2);
  });
});

describe("search", () => {
  beforeEach(() => {
    ElasticSearchMock.clearAll();
  });

  it("makes the expected ES call and maps the data", async () => {
    ElasticSearchMock.add(
      {
        method: ["GET", "POST"],
        path: ["/_search", "/institutions/_search"],
        body: {
          query: searchQuery(),
          size: 20,
        },
      },
      () => {
        return {
          hits: {
            hits: [
              {
                _source: elasticSearchInstitutionData,
              },
            ],
          },
        };
      },
    );

    const results = await search("MX Bank", MappedJobTypes.AGGREGATE);

    expect(results).toEqual([elasticSearchInstitutionData]);
  });

  it("excludes test banks in ES search when ENV is prod", async () => {
    config.ENV = "prod";
    ElasticSearchMock.add(
      {
        method: ["GET", "POST"],
        path: ["/_search", "/institutions/_search"],
        body: {
          query: searchQuery({ filterTestBanks: true }),
          size: 20,
        },
      },
      () => {
        return {
          hits: {
            hits: [
              {
                _source: elasticSearchInstitutionData,
              },
            ],
          },
        };
      },
    );

    await search("MX Bank", MappedJobTypes.AGGREGATE);
    config.ENV = "test";
  });

  it("includes a filter when job type is identity", async () => {
    ElasticSearchMock.add(
      {
        method: ["GET", "POST"],
        path: ["/_search", "/institutions/_search"],
        body: {
          query: searchQuery({
            jobTypeQuery: testPreferences.supportedAggregators.map(
              (aggregator) => ({
                bool: {
                  must: [
                    {
                      term: {
                        [`${aggregator}.supports_identification`]: true,
                      },
                    },
                  ],
                },
              }),
            ),
          }),
          size: 20,
        },
      },
      () => {
        return {
          hits: {
            hits: [
              {
                _source: elasticSearchInstitutionData,
              },
            ],
          },
        };
      },
    );

    const results = await search("MX Bank", MappedJobTypes.IDENTITY);

    expect(results).toEqual([elasticSearchInstitutionData]);
  });

  it("includes identity and verification filter when job type is aggregate_identity_verification", async () => {
    const supportsArray = [
      "supports_aggregation",
      "supports_verification",
      "supports_identification",
    ];

    ElasticSearchMock.add(
      {
        method: ["GET", "POST"],
        path: ["/_search", "/institutions/_search"],
        body: {
          query: searchQuery({
            jobTypeQuery: testPreferences.supportedAggregators.map(
              (aggregator) => ({
                bool: {
                  must: supportsArray.map((supportsProp) => ({
                    term: {
                      [`${aggregator}.${supportsProp}`]: true,
                    },
                  })),
                },
              }),
            ),
          }),
          size: 20,
        },
      },
      () => {
        return {
          hits: {
            hits: [
              {
                _source: elasticSearchInstitutionData,
              },
            ],
          },
        };
      },
    );

    const results = await search("MX Bank", MappedJobTypes.ALL);

    expect(results).toEqual([elasticSearchInstitutionData]);
  });

  it("does not break when ES returns an empty array", async () => {
    ElasticSearchMock.add(
      {
        method: ["GET", "POST"],
        path: ["/_search", "/institutions/_search"],
      },
      () => {
        return {
          hits: { hits: [] },
        };
      },
    );

    const results = await search("nothing", MappedJobTypes.AGGREGATE);

    expect(results).toEqual([]);
  });
});

describe("searchByRoutingNumber", () => {
  beforeEach(() => {
    ElasticSearchMock.clearAll();
  });

  it("includes the routing number search query in the request", async () => {
    const routingNumber = "1234567";

    ElasticSearchMock.add(
      {
        method: ["GET", "POST"],
        path: ["/_search", "/institutions/_search"],
        body: {
          query: searchQuery({ routingNumber }),
          size: 20,
        },
      },
      () => {
        return {
          hits: {
            hits: [
              {
                _source: elasticSearchInstitutionData,
              },
            ],
          },
        };
      },
    );

    const results = await searchByRoutingNumber(
      routingNumber,
      MappedJobTypes.AGGREGATE,
    );

    expect(results).toEqual([elasticSearchInstitutionData]);
  });
});

describe("getInstitution", () => {
  it("makes the expected ES call and gets the expected institution response", async () => {
    ElasticSearchMock.clearAll();

    ElasticSearchMock.add(
      {
        method: "GET",
        path: "/institutions/_doc/UCP-1234",
      },
      () => {
        return {
          _source: elasticSearchInstitutionData,
        };
      },
    );

    const institutionResponse = await getInstitution("UCP-1234");
    expect(institutionResponse).toEqual(elasticSearchInstitutionData);
  });
});

describe("getRecommendedInstitutions", () => {
  it("makes expected call to ES, gets a list of favorite institutions, and doesn't fail if an institution isn't found", async () => {
    ElasticSearchMock.clearAll();

    ElasticSearchMock.add(
      {
        method: "POST",
        path: "/_mget",
        body: {
          docs: testPreferences.recommendedInstitutions.map(
            (institutionId: string) => ({
              _index: "institutions",
              _id: institutionId,
            }),
          ),
        },
      },
      () => {
        return {
          docs: [{ _source: elasticSearchInstitutionData }, {}],
        };
      },
    );

    const recommendedInstitutions = await getRecommendedInstitutions({
      jobType: MappedJobTypes.AGGREGATE,
    });

    expect(recommendedInstitutions).toEqual([elasticSearchInstitutionData]);
  });

  it("filters out institutions that don't have available aggregators because of job type", async () => {
    const mockPreferences: preferences.Preferences = {
      ...testPreferences,
      supportedAggregators: [TEST_EXAMPLE_A_AGGREGATOR_STRING],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    jest
      .spyOn(preferences, "getPreferences")
      .mockResolvedValue(mockPreferences);

    ElasticSearchMock.clearAll();

    ElasticSearchMock.add(
      {
        method: "POST",
        path: "/_mget",
        body: {
          docs: testPreferences.recommendedInstitutions.map(
            (institutionId: string) => ({
              _index: "institutions",
              _id: institutionId,
            }),
          ),
        },
      },
      () => {
        return {
          docs: [
            {
              _source: {
                ...elasticSearchInstitutionData,
                [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
                  supports_aggregation: false,
                  supports_oauth: false,
                  supports_identification: false,
                  supports_verification: false,
                  supports_history: false,
                },
              },
            },
          ],
        };
      },
    );

    const recommendedInstitutions = await getRecommendedInstitutions({
      jobType: MappedJobTypes.AGGREGATE,
    });

    expect(recommendedInstitutions).toEqual([]);
  });

  it("filters out test institutions if ENV equals 'prod'", async () => {
    // config.ENV = "prod";

    const mockPreferences: preferences.Preferences = {
      ...testPreferences,
      recommendedInstitutions: [
        ...testPreferences.recommendedInstitutions,
        "6301ccb3-5deb-4efa-8f94-fb3c9c129922", // Real institution
      ],
    } as any;

    jest
      .spyOn(preferences, "getPreferences")
      .mockResolvedValue(mockPreferences);

    ElasticSearchMock.clearAll();

    ElasticSearchMock.add(
      {
        method: "POST",
        path: "/_mget",
        body: {
          docs: testPreferences.recommendedInstitutions.map(
            (institutionId: string) => ({
              _index: "institutions",
              _id: institutionId,
            }),
          ),
        },
      },
      () => {
        return {
          docs: [
            {
              _source: elasticSearchInstitutionDataFavs,
            },
          ],
        };
      },
    );

    const recommendedInstitutions = await getRecommendedInstitutions({
      jobType: MappedJobTypes.AGGREGATE,
      filterTestBanks: true,
    });
    expect(recommendedInstitutions).toEqual(
      elasticSearchInstitutionDataFavs[0],
    );
    // config.ENV = "test";
  });
});

describe("deleteRemovedInstitutions", () => {
  it("should delete institutions that are no longer in the new list", async () => {
    const newInstitutions = [{ id: "new1" }, { id: "new2" }];

    const oldInstitutions = [{ id: "old1" }, { id: "old2" }, { id: "new1" }];

    const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});
    const shouldBeDeleted = ["old1", "old2"];
    const deletedIds: string[] = [];

    await overwriteSet(
      INSTITUTION_CURRENT_LIST_IDS,
      oldInstitutions.map((ins) => ins.id),
    );

    ElasticSearchMock.add(
      {
        method: "DELETE",
        path: "/institutions/_doc/:id",
      },
      (params) => {
        const pathStr = params.path as string;
        const id = pathStr.split("/").pop();
        deletedIds.push(id);
        return {};
      },
    );

    await deleteRemovedInstitutions(newInstitutions as CachedInstitution[]);

    expect(infoSpy).toHaveBeenCalledWith(
      "deleting institutions",
      shouldBeDeleted,
    );

    expect(deletedIds).toEqual(shouldBeDeleted);
  });

  it("should not try to delete anything if no institutions were removed", async () => {
    const newInstitutions = [{ id: "new1" }, { id: "new2" }];

    const oldInstitutions = [{ id: "new1" }, { id: "new2" }];

    const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});

    let deletedCount = 0;
    ElasticSearchMock.add(
      {
        method: "DELETE",
        path: "/institutions/_doc/:id",
      },
      () => {
        deletedCount += 1;
        return {};
      },
    );

    await overwriteSet(
      INSTITUTION_CURRENT_LIST_IDS,
      oldInstitutions.map((ins) => ins.id),
    );

    await deleteRemovedInstitutions(newInstitutions as CachedInstitution[]);

    expect(infoSpy).not.toHaveBeenCalled();
    expect(deletedCount).toEqual(0);
  });

  it("should handle errors during deletion gracefully", async () => {
    const logErrorSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => {});

    const newInstitutions = [{ id: "new1" }];
    const oldInstitutions = [{ id: "old1" }, { id: "new1" }];

    await overwriteSet(
      INSTITUTION_CURRENT_LIST_IDS,
      oldInstitutions.map((ins) => ins.id),
    );

    const mockError = elasticSearchMockError({
      message: "Delete failed",
      statusCode: 400,
    });

    ElasticSearchMock.add(
      {
        method: "DELETE",
        path: "/institutions/_doc/:id",
      },
      () => {
        return mockError;
      },
    );

    await deleteRemovedInstitutions(newInstitutions as CachedInstitution[]);

    expect(logErrorSpy).toHaveBeenCalledWith(mockError);
  });
});

describe("updateInstitutions", () => {
  it("calls ES update for each institution in the list", async () => {
    const mockInstitutions = [
      { id: "123", name: "Institution A" },
      { id: "456", name: "Institution B" },
    ] as CachedInstitution[];

    interface esDocObj {
      // eslint-disable-next-line @typescript-eslint/member-delimiter-style
      doc: { id: string; name: string };
    }

    const elasticSearchUpdatesMade: esDocObj[] = [];
    ElasticSearchMock.add(
      {
        method: ["PUT", "POST"],
        path: "/institutions/_update/:id",
      },
      (params) => {
        elasticSearchUpdatesMade.push(params.body as esDocObj);
        return {};
      },
    );

    await updateInstitutions(mockInstitutions);

    const updatedInstitutions = elasticSearchUpdatesMade.map(
      (body) => body.doc,
    );
    expect(updatedInstitutions).toEqual(mockInstitutions);
  });
});
