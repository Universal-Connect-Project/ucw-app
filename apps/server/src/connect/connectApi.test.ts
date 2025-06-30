import { ConnectApi } from "./connectApi";
import { ChallengeType, ComboJobTypes, ConnectionStatus } from "@repo/utils";
import type { Context } from "../shared/contract";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import {
  ANSWER_CHALLENGE_PATH,
  CONNECTION_BY_ID_PATH,
  mxTestData,
  READ_MEMBER_STATUS_PATH,
  UPDATE_CONNECTION_PATH,
  waitFor,
} from "@repo/utils-dev-dependency";
import { server } from "../test/testServer";
import { http, HttpResponse } from "msw";
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";
import { AKOYA_AGGREGATOR_STRING } from "@repo/akoya-adapter";
import type { PerformanceObject } from "../aggregatorPerformanceMeasuring/utils";
import {
  createPerformanceObject,
  getPerformanceObject,
  setPausedByMfa,
} from "../aggregatorPerformanceMeasuring/utils";
import {
  answerMfaMemberData,
  memberCreateData,
  memberData,
  memberStatusData,
} from "@repo/utils-dev-dependency/mx/testData";
import expectPerformanceObject from "../test/expectPerformanceObject";
const {
  connectionByIdMemberData,
  memberStatusData: mxMemberStatusData,
  oauthMemberdata: mxOauthMemberData,
} = mxTestData;

const resolvedUserId = "resolvedUserId";
const performanceSessionId = "aaaa-bbbb-cccc-dddd-eeee";

describe("connectApi", () => {
  let testContext: Context;
  let connectApi: ConnectApi;
  beforeEach(() => {
    testContext = {
      aggregator: MX_AGGREGATOR_STRING,
      institutionId: "xxx",
      resolvedUserId,
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      performanceSessionId,
    } as Context;

    connectApi = new ConnectApi({
      context: testContext,
    });

    connectApi.init();
    jest.useRealTimers();
    jest.restoreAllMocks();
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

    it("returns a member, sends a connection start event, and creates a performance object in redis on a new connection", async () => {
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

      const performanceObject = await getPerformanceObject(
        requestLog[0].connectionId,
      );
      expect(performanceObject).toEqual(
        expect.objectContaining({
          performanceSessionId: requestLog[0].connectionId,
          connectionId: "testGuid1",
          userId: resolvedUserId,
          aggregatorId: MX_AGGREGATOR_STRING,
          lastUiUpdateTimestamp: expect.any(Number),
          pausedByMfa: false,
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

  describe("updateMember", () => {
    it("answers challenge question with updated credentials and unpauses performance object", async () => {
      await createPerformanceObject({
        userId: resolvedUserId,
        connectionId: "testGuid",
        performanceSessionId,
        aggregatorId: MX_AGGREGATOR_STRING,
      });
      await setPausedByMfa(performanceSessionId, true);

      await expectPerformanceObject(performanceSessionId, {
        pausedByMfa: true,
      });

      const customContext = { ...testContext, current_job_id: "testJobGuid" };
      const customApi = new ConnectApi({ context: customContext });
      customApi.init();

      let requestBody: unknown;

      server.use(
        http.put(ANSWER_CHALLENGE_PATH, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({});
        }),
      );

      await customApi.updateMember(answerMfaMemberData);

      await expectPerformanceObject(performanceSessionId, {
        pausedByMfa: false,
      });

      expect(requestBody).toEqual({
        member: {
          challenges: [{ guid: "credentialGuid", value: "credentialValue" }],
        },
      });
    });

    it("updates member without challenges and does not pause performance object", async () => {
      await createPerformanceObject({
        userId: resolvedUserId,
        connectionId: "testGuid",
        performanceSessionId,
        aggregatorId: MX_AGGREGATOR_STRING,
      });
      await setPausedByMfa(performanceSessionId, true);

      let performanceObject = await expectPerformanceObject(
        performanceSessionId,
        {
          pausedByMfa: true,
        },
      );

      const timeStampBeforeUpdate = performanceObject.lastUiUpdateTimestamp;

      let requestBody: unknown;

      server.use(
        http.put(UPDATE_CONNECTION_PATH, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(memberData);
        }),
      );

      const connection = await connectApi.updateMember({
        ...memberCreateData,
        guid: "testGuid1",
      });

      performanceObject = await expectPerformanceObject(performanceSessionId, {
        pausedByMfa: true,
      });

      expect(performanceObject.lastUiUpdateTimestamp).toBe(
        timeStampBeforeUpdate,
      );

      expect(requestBody).toEqual({
        member: {
          credentials: [
            { guid: "testCredentialGuid", value: "testCredentialValue" },
          ],
        },
      });
      expect(connection).not.toBeUndefined();
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

    it("records a pause event when mfa challenges. Sets performance object to pausedByMfa and updates the lastUiUpdateTimestamp", async () => {
      const requestLog = setupPerformanceHandlers(["connectionPause"]);

      await createPerformanceObject({
        userId: resolvedUserId,
        connectionId: "testGuid",
        performanceSessionId,
        aggregatorId: MX_AGGREGATOR_STRING,
      });

      const { lastUiUpdateTimestamp: firstUiUpdateTimestamp } =
        await getPerformanceObject(performanceSessionId);

      server.use(
        http.get(READ_MEMBER_STATUS_PATH, () =>
          HttpResponse.json({
            member: {
              connection_status: ConnectionStatus[ConnectionStatus.CHALLENGED],
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

      const performanceObject = await expectPerformanceObject(
        performanceSessionId,
        {
          pausedByMfa: true,
        },
      );
      expect(performanceObject.lastUiUpdateTimestamp).toBeGreaterThan(
        firstUiUpdateTimestamp,
      );

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

describe("performanceResilience life cycle through ConnectApi", () => {
  let testContext: Context;
  let connectApi: ConnectApi;
  let latestUiUpdateTimestamp: number;
  let answerMfaContextConnectApi: ConnectApi;

  function expectUpdatedUiTimestamp(newPerformanceObject: PerformanceObject) {
    expect(latestUiUpdateTimestamp).toBeLessThan(
      newPerformanceObject.lastUiUpdateTimestamp,
    );
    latestUiUpdateTimestamp = newPerformanceObject.lastUiUpdateTimestamp;
  }

  beforeEach(() => {
    testContext = {
      aggregator: MX_AGGREGATOR_STRING,
      institutionId: "xxx",
      resolvedUserId,
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      performanceSessionId,
    } as Context;

    connectApi = new ConnectApi({
      context: testContext,
    });
    answerMfaContextConnectApi = new ConnectApi({
      context: { ...testContext, current_job_id: "testJobGuid" },
    });

    answerMfaContextConnectApi.init();
    connectApi.init();
  });

  it("creates, pauses, resumes, completes, deletes a performance object connecting with MFA", async () => {
    jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(performanceSessionId);

    // Create a member
    await connectApi.addMember(memberCreateData);

    let performanceObject = await expectPerformanceObject(performanceSessionId);
    latestUiUpdateTimestamp = performanceObject.lastUiUpdateTimestamp;

    // Initiate MFA challenge
    server.use(
      http.get(READ_MEMBER_STATUS_PATH, async () => {
        return HttpResponse.json({
          member: {
            ...memberStatusData.member,
            connection_status: ConnectionStatus[ConnectionStatus.CHALLENGED],
            challenges: [
              {
                id: "testId",
                question: "testQuestion",
                type: ChallengeType.QUESTION,
              },
            ],
          },
        });
      }),
    );

    await connectApi.loadMemberByGuid("testGuid");

    performanceObject = await expectPerformanceObject(performanceSessionId, {
      pausedByMfa: true,
    });

    expectUpdatedUiTimestamp(performanceObject);

    // Answer MFA challenge
    await answerMfaContextConnectApi.updateMember(answerMfaMemberData);

    performanceObject = await expectPerformanceObject(performanceSessionId, {
      pausedByMfa: false,
    });

    expectUpdatedUiTimestamp(performanceObject);

    // Member connected
    server.use(
      http.get(READ_MEMBER_STATUS_PATH, async () => {
        return HttpResponse.json(memberStatusData);
      }),
    );

    await connectApi.loadMemberByGuid("testGuid");

    await expectPerformanceObject(performanceSessionId, {});
  });
});
