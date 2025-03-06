import { getRecommendedInstitutions } from "../services/ElasticSearchClient";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import type { CachedInstitution } from "../shared/contract";
import { ComboJobTypes } from "@repo/utils";
import * as preferences from "../shared/preferences";
import { ElasticSearchMock } from "./elasticSearchMock";
import { elasticSearchInstitutionDataFavs } from "./testData/institution";

export const generateElasticSearchRecommendedInstitutionTestSetup =
  async () => {
    const mockPreferences: preferences.Preferences = {
      ...testPreferences,
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
          docs: mockPreferences.recommendedInstitutions.map(
            (institutionId: string) => ({
              _index: "institutions",
              _id: institutionId,
            }),
          ),
        },
      },
      () => {
        return {
          docs: elasticSearchInstitutionDataFavs.map(
            (ins: CachedInstitution) => ({
              _source: ins,
            }),
          ),
        };
      },
    );

    return await getRecommendedInstitutions({
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    });
  };
