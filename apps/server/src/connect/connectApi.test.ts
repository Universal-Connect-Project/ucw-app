import { ConnectApi } from "./connectApi";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter/constants";
import { ComboJobTypes, ConnectionStatus } from "@repo/utils";
import type { Context } from "../shared/contract";
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
          postMessageEventData: {
            memberConnected: {
              aggregator: "testExampleA",
              member_guid: "testConnectionId",
              user_guid: undefined,
            },
            memberStatusUpdate: {
              aggregator: "testExampleA",
              connection_status: 0,
              member_guid: "testConnectionId",
              user_guid: undefined,
            },
          },
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
        postMessageEventData: {
          memberConnected: {
            aggregator: "testExampleA",
            member_guid: "testConnectionId",
            test: "connected",
            user_guid: null,
          },
          memberStatusUpdate: {
            aggregator: "testExampleA",
            connection_status: 6,
            member_guid: "testConnectionId",
            test: "updated",
            user_guid: null,
          },
        },
        user_guid: null,
      });
    });
  });
});
