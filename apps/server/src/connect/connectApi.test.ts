import { ConnectApi } from "./connectApi";
import { ChallengeType, ComboJobTypes, ConnectionStatus } from "@repo/utils";
import type { Context } from "../shared/contract";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import {
  CONNECTION_BY_ID_PATH,
  mxTestData,
  READ_MEMBER_STATUS_PATH,
  waitFor,
} from "@repo/utils-dev-dependency";
import { server } from "../test/testServer";
import { http, HttpResponse } from "msw";
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";
import { AKOYA_AGGREGATOR_STRING } from "@repo/akoya-adapter";

const {
  connectionByIdMemberData,
  memberStatusData: mxMemberStatusData,
  oauthMemberdata: mxOauthMemberData,
} = mxTestData;

const resolvedUserId = "resolvedUserId";

describe("connectApi", () => {
  let testContext: Context;
  let connectApi: ConnectApi;
  beforeEach(() => {
    testContext = {
      aggregator: MX_AGGREGATOR_STRING,
      institutionId: "xxx",
      resolvedUserId,
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    } as Context;

    connectApi = new ConnectApi({
      context: testContext,
    });

    connectApi.init();
  });

  describe("addMember", () => {
    it("returns a member and doesnt send a connection start event on refresh connection", async () => {
      const requestLog = setupPerformanceHandlers([
        "connectionStart",
        "connectionPause",
      ]);

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
        rawInstitutionData: {
          ucpInstitutionId: "testUcpInstitutionId",
        },
      };

      const mxMember = mxOauthMemberData.member;

      const response = await connectApi.addMember(memberData);

      expect(response).toEqual({
        member: {
          aggregator: testContext.aggregator,
          connection_status: ConnectionStatus.CREATED,
          guid: memberData.guid,
          institution_guid: undefined,
          is_being_aggregated: undefined,
          is_oauth: mxMember.is_oauth,
          mfa: {
            credentials: undefined,
          },
          most_recent_job_guid: null,
          oauth_window_uri: mxMember.oauth_window_uri,
          postMessageEventData: {
            memberConnected: {
              aggregator: MX_AGGREGATOR_STRING,
              member_guid: memberData.guid,
              user_guid: resolvedUserId,
            },
            memberStatusUpdate: {
              aggregator: MX_AGGREGATOR_STRING,
              connection_status: 0,
              member_guid: memberData.guid,
              user_guid: resolvedUserId,
            },
          },
          user_guid: resolvedUserId,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(requestLog.length).toBe(0);
    });

    it("returns a member and sends a connection start event on new connection", async () => {
      const requestLog = setupPerformanceHandlers([
        "connectionStart",
        "connectionPause",
      ]);

      const memberData = {
        institution_guid: "testInstitutionGuid",
        is_oauth: false,
        skip_aggregration: false,
        credentials: [
          {
            guid: "testCredentialGuid",
            value: "testCredentialValue",
          },
        ],
        rawInstitutionData: {
          ucpInstitutionId: "testUcpInstitutionId",
        },
      };

      const response = await connectApi.addMember(memberData);

      expect(response).toEqual({
        member: {
          aggregator: testContext.aggregator,
          connection_status: ConnectionStatus.CREATED,
          guid: "testGuid1",
          institution_guid: "insitutionCode1",
          is_being_aggregated: false,
          is_oauth: false,
          mfa: {
            credentials: undefined,
          },
          most_recent_job_guid: null,
          oauth_window_uri: undefined,
          postMessageEventData: {
            memberConnected: {
              aggregator: MX_AGGREGATOR_STRING,
              member_guid: "testGuid1",
              user_guid: undefined,
            },
            memberStatusUpdate: {
              aggregator: MX_AGGREGATOR_STRING,
              connection_status: 0,
              member_guid: "testGuid1",
              user_guid: undefined,
            },
          },
          user_guid: undefined,
        },
      });

      await waitFor(() => expect(requestLog.length).toBe(1));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          connectionId: expect.any(String),
          body: {
            aggregatorId: MX_AGGREGATOR_STRING,
            institutionId: "testUcpInstitutionId",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
            recordDuration: true,
          },
        }),
      );
    });

    it("sends a connection start event with duration disabled for akoya aggregator", async () => {
      connectApi = new ConnectApi({
        context: { ...testContext, aggregator: AKOYA_AGGREGATOR_STRING },
      });

      connectApi.init();

      const requestLog = setupPerformanceHandlers([
        "connectionStart",
        "connectionPause",
      ]);

      const memberData = {
        institution_guid: "testInstitutionGuid",
        is_oauth: false,
        skip_aggregration: false,
        credentials: [
          {
            guid: "testCredentialGuid",
            value: "testCredentialValue",
          },
        ],
        rawInstitutionData: {
          ucpInstitutionId: "testUcpInstitutionId",
        },
      };

      await connectApi.addMember(memberData);

      await waitFor(() => expect(requestLog.length).toBe(1));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          connectionId: expect.any(String),
          body: {
            aggregatorId: AKOYA_AGGREGATOR_STRING,
            institutionId: "testUcpInstitutionId",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
            recordDuration: false,
          },
        }),
      );
    });

    it("calls connectionStart and connectionPause when is_oauth is true", async () => {
      const requestLog = setupPerformanceHandlers([
        "connectionStart",
        "connectionPause",
      ]);

      const memberData = {
        institution_guid: "testInstitutionGuid",
        is_oauth: true,
        skip_aggregration: false,
        credentials: [
          {
            guid: "testCredentialGuid",
            value: "testCredentialValue",
          },
        ],
        rawInstitutionData: {
          ucpInstitutionId: "testUcpInstitutionId",
        },
      };

      await connectApi.addMember(memberData);

      await waitFor(() => expect(requestLog.length).toBe(2));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionStart",
          connectionId: expect.any(String),
          body: {
            aggregatorId: "mx",
            institutionId: "testUcpInstitutionId",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
            recordDuration: true,
          },
        }),
      );
      expect(requestLog[1]).toEqual(
        expect.objectContaining({
          eventType: "connectionPause",
          connectionId: expect.any(String),
        }),
      );
    });
  });

  describe("loadMemberByGuid", () => {
    it("returns a member array with a most recent job guid", async () => {
      const response = await connectApi.loadMemberByGuid("testGuid");

      const mxConnectionByIdMember = connectionByIdMemberData.member;

      const mxMemberStatus = mxMemberStatusData.member;

      expect(response).toEqual({
        aggregator: testContext.aggregator,
        connection_status: ConnectionStatus.CONNECTED,
        guid: mxConnectionByIdMember.guid,
        institution_guid: mxConnectionByIdMember.institution_code,
        is_being_aggregated: false,
        is_oauth: false,
        mfa: {
          credentials: [],
        },
        most_recent_job_guid: mxMemberStatus.guid,
        oauth_window_uri: mxConnectionByIdMember.oauth_window_uri,
        postMessageEventData: {
          memberConnected: {
            aggregator: MX_AGGREGATOR_STRING,
            member_guid: mxConnectionByIdMember.guid,
            user_guid: resolvedUserId,
          },
          memberStatusUpdate: {
            aggregator: MX_AGGREGATOR_STRING,
            connection_status: 6,
            member_guid: mxConnectionByIdMember.guid,
            user_guid: resolvedUserId,
          },
        },
        user_guid: resolvedUserId,
      });
    });

    it("records a pause event when mfa challenges", async () => {
      const requestLog = setupPerformanceHandlers(["connectionPause"]);

      server.use(
        http.get(READ_MEMBER_STATUS_PATH, () =>
          HttpResponse.json({
            member: {
              connection_status: ConnectionStatus.CHALLENGED,
              guid: "testGuid",
              challenges: [
                {
                  id: "testId",
                  question: "testQuestion",
                  type: ChallengeType.QUESTION,
                },
              ],
            },
          }),
        ),
      );

      await connectApi.loadMemberByGuid("testGuid");

      await waitFor(() => expect(requestLog.length).toBe(1));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionPause",
          connectionId: expect.any(String),
        }),
      );
    });

    it("records success event if member is connected and is not being aggregated", async () => {
      const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

      await connectApi.loadMemberByGuid("testGuid");

      await waitFor(() => expect(requestLog.length).toBe(1));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionSuccess",
          connectionId: expect.any(String),
        }),
      );
    });

    it("records resume event if member is connected is being aggregated and is Oauth", async () => {
      const requestLog = setupPerformanceHandlers(["connectionResume"]);

      server.use(
        http.get(CONNECTION_BY_ID_PATH, () =>
          HttpResponse.json({
            member: {
              ...mxOauthMemberData.member,
              is_oauth: true,
              is_being_aggregated: true,
            },
          }),
        ),
      );

      await connectApi.loadMemberByGuid("testGuid");

      await waitFor(() => expect(requestLog.length).toBe(1));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionResume",
          connectionId: expect.any(String),
        }),
      );
    });
  });
});
