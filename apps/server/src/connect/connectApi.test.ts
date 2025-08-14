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
  createPerformancePollingObject,
  getPerformanceObject,
  pausePolling,
} from "../aggregatorPerformanceMeasuring/utils";
import * as performanceMeasuringUtils from "../aggregatorPerformanceMeasuring/utils";
import {
  answerMfaMemberData,
  memberCreateData,
  memberData as mxTestMemberData,
  memberStatusData,
} from "@repo/utils-dev-dependency/mx/testData";
import expectPerformanceObject from "../test/expectPerformanceObject";
import * as performanceTracking from "../services/performanceTracking";
import { PLAID_AGGREGATOR_STRING } from "@repo/plaid-adapter";
import * as config from "../config";
import { get } from "../services/storageClient/redis";
import { keys as _keys } from "../__mocks__/redis";

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
  let refreshingContextConnectApi: ConnectApi;

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
    refreshingContextConnectApi = new ConnectApi({
      context: {
        ...testContext,
        connectionId: "testConnectionId",
      },
    });

    refreshingContextConnectApi.init();
    connectApi.init();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("addMember", () => {
    it("returns a member and doesnt send a connection start event and doesn't create a performance polling object on refresh connection", async () => {
      const fakeSessionId = "test-session-id-124-123";
      jest
        .spyOn(globalThis.crypto, "randomUUID")
        .mockReturnValue(fakeSessionId);

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

      const response = await refreshingContextConnectApi.addMember(memberData);

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

      const performanceObject = await getPerformanceObject(fakeSessionId);
      expect(performanceObject).toBeUndefined();
    });

    it("does NOT create a performance object when getRequiresPollingForPerformance returns false", async () => {
      jest
        .spyOn(connectApi, "getRequiresPollingForPerformance")
        .mockReturnValue(false);

      const fakeSessionId = "test-session-id-no-resilience";
      jest
        .spyOn(globalThis.crypto, "randomUUID")
        .mockReturnValue(fakeSessionId);

      await connectApi.addMember(memberCreateData);

      const performanceObject = await getPerformanceObject(fakeSessionId);
      expect(performanceObject).toBeUndefined();
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
          guid: mxTestMemberData.member.guid,
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
              member_guid: mxTestMemberData.member.guid,
              user_guid: undefined,
            },
            memberStatusUpdate: {
              aggregator: MX_AGGREGATOR_STRING,
              connection_status: 0,
              member_guid: mxTestMemberData.member.guid,
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
          connectionId: mxTestMemberData.member.guid,
          userId: resolvedUserId,
          aggregatorId: MX_AGGREGATOR_STRING,
          lastUiUpdateTimestamp: expect.any(Number),
          paused: false,
        }),
      );
    });

    it("does not create a performance object or send a performance start event for Plaid because getPerformanceEnabled returns false", async () => {
      const requestLog = setupPerformanceHandlers([
        "connectionStart",
        "connectionPause",
      ]);
      connectApi = new ConnectApi({
        context: { ...testContext, aggregator: PLAID_AGGREGATOR_STRING },
      });

      connectApi.init();

      const fakeSessionId = "test-session-id-no-performance";
      jest
        .spyOn(globalThis.crypto, "randomUUID")
        .mockReturnValue(fakeSessionId);

      await connectApi.addMember(memberCreateData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(requestLog.length).toBe(0);

      const performanceObject = await getPerformanceObject(fakeSessionId);
      expect(performanceObject).toBeUndefined();
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

    it("calls connectionStart and connectionPause when is_oauth is true, but doesn't pause the local performance object", async () => {
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
      const performanceObject = await getPerformanceObject(
        requestLog[0].connectionId,
      );
      expect(performanceObject).toEqual(
        expect.objectContaining({
          performanceSessionId: requestLog[0].connectionId,
          connectionId: mxTestMemberData.member.guid,
          userId: resolvedUserId,
          aggregatorId: MX_AGGREGATOR_STRING,
          lastUiUpdateTimestamp: expect.any(Number),
          paused: false,
        }),
      );
    });

    it("creates a connectionCleanUp object when cleanup feature is enabled", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        CONNECTION_EXPIRATION_MINUTES: 30,
        EXPIRED_CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });

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

      const performanceSessionId = connectApi.context.performanceSessionId;
      const cleanUpObj = await get(`cleanup:${performanceSessionId}`);
      const cleanUpObjects = await _keys("cleanup:*");
      expect(cleanUpObjects.length).toBe(1);

      expect(cleanUpObj).toEqual({
        id: performanceSessionId,
        connectionId: mxTestMemberData.member.guid,
        createdAt: expect.any(Number),
        aggregatorId: MX_AGGREGATOR_STRING,
        userId: resolvedUserId,
      });
    });

    it("does NOT create a connectionCleanUp object when cleanup feature is disabled", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({});

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

      const cleanUpObjects = await _keys("cleanup:*");
      expect(cleanUpObjects.length).toBe(0);
    });

    it("creates a connectionCleanUp object when cleanup feature is enabled and is refreshing a connection", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        CONNECTION_EXPIRATION_MINUTES: 30,
        EXPIRED_CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });

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

      await refreshingContextConnectApi.addMember(memberData);

      const performanceSessionId =
        refreshingContextConnectApi.context.performanceSessionId;
      const cleanUpObj = await get(`cleanup:${performanceSessionId}`);
      const cleanUpObjects = await _keys("cleanup:*");
      expect(cleanUpObjects.length).toBe(1);

      expect(cleanUpObj).toEqual({
        id: performanceSessionId,
        connectionId: memberData.guid,
        createdAt: expect.any(Number),
        aggregatorId: MX_AGGREGATOR_STRING,
        userId: resolvedUserId,
      });
    });
  });

  describe("updateMember", () => {
    it("answers challenge question with updated credentials and unpauses performance object", async () => {
      await createPerformancePollingObject({
        userId: resolvedUserId,
        connectionId: "testGuid",
        performanceSessionId,
        aggregatorId: MX_AGGREGATOR_STRING,
      });
      await pausePolling(performanceSessionId);

      await expectPerformanceObject(performanceSessionId, {
        paused: true,
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
        paused: false,
      });

      expect(requestBody).toEqual({
        member: {
          challenges: [{ guid: "credentialGuid", value: "credentialValue" }],
        },
      });
    });

    it("updates member without challenges and does not pause performance object, updates lastUiUpdateTimestamp", async () => {
      await createPerformancePollingObject({
        userId: resolvedUserId,
        connectionId: "testGuid",
        performanceSessionId,
        aggregatorId: MX_AGGREGATOR_STRING,
      });

      let performanceObject = await expectPerformanceObject(
        performanceSessionId,
        {
          paused: false,
        },
      );

      const timeStampBeforeUpdate = performanceObject.lastUiUpdateTimestamp;

      let requestBody: unknown;

      server.use(
        http.put(UPDATE_CONNECTION_PATH, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mxTestMemberData);
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const connection = await connectApi.updateMember({
        ...memberCreateData,
        guid: mxTestMemberData.member.guid,
      });

      performanceObject = await expectPerformanceObject(performanceSessionId, {
        paused: false,
      });

      expect(performanceObject.lastUiUpdateTimestamp).toBeGreaterThan(
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

    describe("when refreshing a connection", () => {
      it("answers challenge question with updated credentials and does NOT call resume connection event", async () => {
        const customContext = {
          ...testContext,
          current_job_id: "testJobGuid",
          connectionId: "testConnectionId",
        };
        const customApi = new ConnectApi({ context: customContext });
        customApi.init();

        const recordConnectionResumeEventSpy = jest.spyOn(
          performanceTracking,
          "recordConnectionResumeEvent",
        );

        let requestBody: unknown;

        server.use(
          http.put(ANSWER_CHALLENGE_PATH, async ({ request }) => {
            requestBody = await request.json();
            return HttpResponse.json({});
          }),
        );

        await customApi.updateMember(answerMfaMemberData);

        expect(recordConnectionResumeEventSpy).not.toHaveBeenCalled();

        expect(requestBody).toEqual({
          member: {
            challenges: [{ guid: "credentialGuid", value: "credentialValue" }],
          },
        });
      });

      it("updates member without challenges and does not call setLastUiUpdateTimestamp", async () => {
        let requestBody: unknown;

        server.use(
          http.put(UPDATE_CONNECTION_PATH, async ({ request }) => {
            requestBody = await request.json();
            return HttpResponse.json(mxTestMemberData);
          }),
        );

        const setLastUiUpdateTimestampSpy = jest.spyOn(
          performanceMeasuringUtils,
          "setLastUiUpdateTimestamp",
        );

        const connection = await refreshingContextConnectApi.updateMember({
          ...memberCreateData,
          guid: mxTestMemberData.member.guid,
        });

        expect(requestBody).toEqual({
          member: {
            credentials: [
              { guid: "testCredentialGuid", value: "testCredentialValue" },
            ],
          },
        });
        expect(connection).not.toBeUndefined();
        expect(setLastUiUpdateTimestampSpy).not.toHaveBeenCalled();
      });
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

    it("records a pause event when mfa challenges. Sets performance object to paused and updates the lastUiUpdateTimestamp", async () => {
      const requestLog = setupPerformanceHandlers(["connectionPause"]);

      await createPerformancePollingObject({
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
          paused: true,
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

    it("updates connectionCleanup object with connectionId and new createdAt when recordSuccessEvent is called", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        ...config.default,
        CONNECTION_EXPIRATION_MINUTES: 30,
        EXPIRED_CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });

      const newConnectionId = "newConnectionId123";

      server.use(
        http.get(CONNECTION_BY_ID_PATH, () =>
          HttpResponse.json({
            ...connectionByIdMemberData,
            member: {
              ...connectionByIdMemberData.member,
              guid: newConnectionId,
            },
          }),
        ),
      );
      const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

      await connectApi.addMember(memberCreateData);

      const performanceSessionId = connectApi.context.performanceSessionId;
      const performanceCleanupKey = `cleanup:${performanceSessionId}`;

      const existingCleanupObj = await get(performanceCleanupKey);
      expect(existingCleanupObj).toBeDefined();

      const initialCreatedAt = existingCleanupObj.createdAt;

      // delay for different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleanupObjBefore = await get(performanceCleanupKey);
      expect(cleanupObjBefore).toEqual(
        expect.objectContaining({
          id: performanceSessionId,
          createdAt: initialCreatedAt,
          aggregatorId: MX_AGGREGATOR_STRING,
          userId: resolvedUserId,
          connectionId: mxTestMemberData.member.guid,
        }),
      );

      await connectApi.loadMemberByGuid("testGuid");

      await waitFor(() => expect(requestLog.length).toBe(1));

      const cleanupObjAfter = await get(performanceCleanupKey);

      expect(cleanupObjAfter).toEqual(
        expect.objectContaining({
          id: performanceSessionId,
          connectionId: newConnectionId,
          aggregatorId: MX_AGGREGATOR_STRING,
          userId: resolvedUserId,
        }),
      );

      expect(cleanupObjAfter.createdAt).toBeGreaterThan(initialCreatedAt);
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

    describe("when refreshing a connection", () => {
      it("does not record a pause event when mfa challenges. Does not pause the performance polling object or update the lastUiUpdateTimestamp", async () => {
        const recordConnectionPauseEventSpy = jest.spyOn(
          performanceTracking,
          "recordConnectionPauseEvent",
        );
        const pausePollingSpy = jest.spyOn(
          performanceMeasuringUtils,
          "pausePolling",
        );
        const setLastUiUpdateTimestampSpy = jest.spyOn(
          performanceMeasuringUtils,
          "setLastUiUpdateTimestamp",
        );

        await refreshingContextConnectApi.loadMemberByGuid("testGuid");

        expect(recordConnectionPauseEventSpy).not.toHaveBeenCalled();
        expect(pausePollingSpy).not.toHaveBeenCalled();
        expect(setLastUiUpdateTimestampSpy).not.toHaveBeenCalled();
      });

      it("does NOT record success event if member is connected and is not being aggregated", async () => {
        const recordConnectionSuccessEventSpy = jest.spyOn(
          performanceTracking,
          "recordSuccessEvent",
        );

        await refreshingContextConnectApi.loadMemberByGuid("testGuid");

        expect(recordConnectionSuccessEventSpy).not.toHaveBeenCalled();
      });

      it("does NOT record resume event if member is connected is being aggregated and is Oauth", async () => {
        const recordConnectionResumeEventSpy = jest.spyOn(
          performanceTracking,
          "recordConnectionResumeEvent",
        );

        await refreshingContextConnectApi.loadMemberByGuid("testGuid");

        expect(recordConnectionResumeEventSpy).not.toHaveBeenCalled();
      });
    });
  });
});

describe("performanceResilience life cycle through ConnectApi", () => {
  const testContext = {
    aggregator: MX_AGGREGATOR_STRING,
    institutionId: "xxx",
    resolvedUserId,
    jobTypes: [ComboJobTypes.TRANSACTIONS],
    performanceSessionId,
  } as Context;
  const connectApi = new ConnectApi({
    context: testContext,
  });
  let latestUiUpdateTimestamp: number;
  const answerMfaContextConnectApi = new ConnectApi({
    context: { ...testContext, current_job_id: "testJobGuid" },
  });

  function expectUpdatedUiTimestamp(newPerformanceObject: PerformanceObject) {
    expect(latestUiUpdateTimestamp).toBeLessThan(
      newPerformanceObject.lastUiUpdateTimestamp,
    );
    latestUiUpdateTimestamp = newPerformanceObject.lastUiUpdateTimestamp;
  }

  it("creates, pauses, resumes, completes, deletes a performance object connecting with MFA", async () => {
    answerMfaContextConnectApi.init();
    connectApi.init();

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
      paused: true,
    });

    expectUpdatedUiTimestamp(performanceObject);

    // Answer MFA challenge
    await answerMfaContextConnectApi.updateMember(answerMfaMemberData);

    performanceObject = await expectPerformanceObject(performanceSessionId, {
      paused: false,
    });

    expectUpdatedUiTimestamp(performanceObject);

    // Member connected
    server.use(
      http.get(READ_MEMBER_STATUS_PATH, async () => {
        return HttpResponse.json(memberStatusData);
      }),
    );

    await connectApi.loadMemberByGuid("testGuid");

    await expectPerformanceObject(performanceSessionId, null);
  });
});
