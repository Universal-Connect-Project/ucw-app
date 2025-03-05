import { elasticSearchInstitutionData } from "../test/testData/institution";
import { ConnectApi } from "./connectApi";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  testExampleInstitution,
} from "../test-adapter/constants";
import * as preferences from "../shared/preferences";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import { ComboJobTypes, ConnectionStatus } from "@repo/utils";
import type { Context } from "src/shared/contract";
import {
  testConnectionId,
  testInstitutionCode,
  testJobId,
} from "../test-adapter/adapter";

const testContext = {
  aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
  updated: false,
  institutionId: "xxx",
  resolvedUserId: null,
  jobTypes: [ComboJobTypes.TRANSACTIONS],
} as Context;

const connectApi = new ConnectApi({
  context: testContext,
});

connectApi.init();

describe("connectApi", () => {
  describe("addMember", () => {
    it("returns a member", async () => {
      const memberData = {
        guid: "testMemberGuid",
        institution_guid: "testInstitutionGuid",
        is_oauth: false,
        skip_aggregration: false,
        credentials: [
          {
            guid: "testCredentialGuid",
            value: "testCredentialValue",
          },
        ],
      };

      const response = await connectApi.addMember(memberData);

      expect(response).toEqual({
        member: {
          aggregator: testContext.aggregator,
          connection_status: ConnectionStatus.CREATED,
          guid: testConnectionId,
          institution_guid: testInstitutionCode,
          is_being_aggregated: false,
          is_oauth: false,
          mfa: {
            credentials: undefined,
          },
          most_recent_job_guid: null,
          oauth_window_uri: undefined,
          user_guid: undefined,
        },
      });
    });
  });

  describe("loadMemberByGuid", () => {
    it("returns a member array with a most recent job guid", async () => {
      const response = await connectApi.loadMemberByGuid("testGuid");

      expect(response).toEqual({
        aggregator: testContext.aggregator,
        connection_status: ConnectionStatus.CONNECTED,
        guid: testConnectionId,
        institution_guid: testInstitutionCode,
        is_being_aggregated: false,
        is_oauth: false,
        mfa: {
          credentials: [],
        },
        most_recent_job_guid: testJobId,
        oauth_window_uri: undefined,
        user_guid: null,
      });
    });
  });

  describe("loadInstitutionByAggregatorId", () => {
    it("returns the institution", async () => {
      const testId = "testId";

      const response = await connectApi.loadInstitutionByAggregatorId(testId);

      expect(response).toEqual({
        code: testId,
        credentials: [],
        guid: testId,
        instructional_data: {},
        logo_url: testExampleInstitution.logo_url,
        name: testExampleInstitution.name,
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        aggregators: undefined,
        supports_oauth: testExampleInstitution.oauth,
        url: testExampleInstitution.url,
      });
    });
  });

  describe("loadInstitutionByUcpId", () => {
    const expectedInstitutionResponse = {
      guid: elasticSearchInstitutionData[TEST_EXAMPLE_B_AGGREGATOR_STRING].id,
      code: elasticSearchInstitutionData[TEST_EXAMPLE_B_AGGREGATOR_STRING].id,
      name: elasticSearchInstitutionData.name,
      url: elasticSearchInstitutionData.url,
      logo_url: elasticSearchInstitutionData.logo,
      instructional_data: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      supports_oauth: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      aggregators: undefined as any,
      aggregator: TEST_EXAMPLE_B_AGGREGATOR_STRING,
    };

    it("finds the institution", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: TEST_EXAMPLE_B_AGGREGATOR_STRING,
      });

      const institution = await connectApi.loadInstitutionByUcpId("UCP-1234");
      expect(institution).toEqual(expectedInstitutionResponse);
    });
  });
});
