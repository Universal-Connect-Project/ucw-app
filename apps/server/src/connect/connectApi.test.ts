import config from "../config";
import { ConnectApi } from "./connectApi";
import { ChallengeType, ComboJobTypes, ConnectionStatus } from "@repo/utils";
import type { Context } from "../shared/contract";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import {
  CONNECTION_BY_ID_PATH,
  mxTestData,
  READ_MEMBER_STATUS_PATH,
} from "@repo/utils-dev-dependency";
import { server } from "../test/testServer";
import { http, HttpResponse } from "msw";

const {
  connectionByIdMemberData,
  memberStatusData: mxMemberStatusData,
  oauthMemberdata: mxOauthMemberData,
} = mxTestData;

const resolvedUserId = "resolvedUserId";

async function waitForRequestLogLength(
  requestLog: unknown[],
  expectedLength: number,
  timeout = 2000,
) {
  const start = Date.now();
  while (requestLog.length < expectedLength) {
    if (Date.now() - start > timeout)
      throw new Error("Timed out waiting for requestLog");
    await new Promise((r) => setTimeout(r, 10));
  }
}

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
    it("returns a member", async () => {
      const requestLog: {
        connectionId: string;
        eventType: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body?: any;
      }[] = [];
      server.use(
        http.post(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionStart`,
          async ({ request, params }) => {
            requestLog.push({
              eventType: "connectionStart",
              connectionId: String(params.connectionId),
              body: await request.json(),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
        http.put(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionPause`,
          ({ params }) => {
            requestLog.push({
              eventType: "connectionPause",
              connectionId: String(params.connectionId),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
      );

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

      await waitForRequestLogLength(requestLog, 1);

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          connectionId: expect.any(String),
          body: {
            aggregatorId: MX_AGGREGATOR_STRING,
            institutionId: "testUcpInstitutionId",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          },
        }),
      );
    });

    it("calls connectionStart and connectionPause when is_oauth is true", async () => {
      const requestLog: {
        connectionId: string;
        eventType: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body?: any;
      }[] = [];

      server.use(
        http.post(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionStart`,
          async ({ request, params }) => {
            requestLog.push({
              eventType: "connectionStart",
              connectionId: String(params.connectionId),
              body: await request.json(),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
        http.put(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionPause`,
          ({ params }) => {
            requestLog.push({
              eventType: "connectionPause",
              connectionId: String(params.connectionId),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
      );

      const memberData = {
        guid: "testMemberGuid",
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

      await waitForRequestLogLength(requestLog, 2);

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionStart",
          connectionId: expect.any(String),
          body: {
            aggregatorId: "mx",
            institutionId: "testUcpInstitutionId",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
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
      const requestLog: {
        connectionId: string;
        eventType: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body?: any;
      }[] = [];

      server.use(
        http.put(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionPause`,
          ({ params }) => {
            requestLog.push({
              eventType: "connectionPause",
              connectionId: String(params.connectionId),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
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

      await waitForRequestLogLength(requestLog, 1);

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionPause",
          connectionId: expect.any(String),
        }),
      );
    });

    it("records success event if member is connected and is not being aggregated", async () => {
      const requestLog: {
        connectionId: string;
        eventType: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body?: any;
      }[] = [];

      server.use(
        http.put(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
          ({ params }) => {
            requestLog.push({
              eventType: "connectionSuccess",
              connectionId: String(params.connectionId),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
      );

      await connectApi.loadMemberByGuid("testGuid");

      await waitForRequestLogLength(requestLog, 1);

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionSuccess",
          connectionId: expect.any(String),
        }),
      );
    });

    it("records resume event if member is connected is being aggregated and is Oauth", async () => {
      const requestLog: {
        connectionId: string;
        eventType: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body?: any;
      }[] = [];

      server.use(
        http.put(
          `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionResume`,
          ({ params }) => {
            requestLog.push({
              eventType: "connectionResume",
              connectionId: String(params.connectionId),
            });
            return HttpResponse.json({ ok: true });
          },
        ),
        http.get(CONNECTION_BY_ID_PATH, () =>
          HttpResponse.json({
            member: {
              ...mxOauthMemberData.member,
              is_being_aggregated: true,
            },
          }),
        ),
      );

      await connectApi.loadMemberByGuid("testGuid");

      await waitForRequestLogLength(requestLog, 1);

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          eventType: "connectionResume",
          connectionId: expect.any(String),
        }),
      );
    });
  });
});
