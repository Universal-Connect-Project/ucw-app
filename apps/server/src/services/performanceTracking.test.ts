import config from "../config";
import { http, HttpResponse } from "msw";
import { server } from "../test/testServer";
import {
  recordConnectionPauseEvent,
  recordConnectionResumeEvent,
  recordStartEvent,
  recordSuccessEvent,
} from "./performanceTracking";
import { ComboJobTypes } from "@repo/utils";
import { mockAccessToken } from "../test/testData/auth0";
import * as logger from "../infra/logger";
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";
import {
  createPerformancePollingObject,
  pausePolling,
} from "../aggregatorPerformanceMeasuring/utils";
import expectPerformanceObject from "../test/expectPerformanceObject";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import * as configModule from "../config";
import { setConnectionForCleanup } from "../connectionCleanup/utils";
import { get } from "../services/storageClient/redis";
import { clearRedisMock } from "../__mocks__/redis";

async function setupRedisPerformanceObject(sessionId: string) {
  createPerformancePollingObject({
    userId: "resolvedUserId",
    connectionId: "MBR-12345",
    performanceSessionId: sessionId,
    aggregatorId: MX_AGGREGATOR_STRING,
  });
  await expectPerformanceObject(sessionId);
}

describe("performanceTracking", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearRedisMock();
  });

  it("calls connectionStart with correct payload and headers", async () => {
    const connectionId = "conn1";
    const requestLog = setupPerformanceHandlers(["connectionStart"]);

    await recordStartEvent({
      aggregatorId: "agg1",
      connectionId: connectionId,
      institutionId: "inst1",
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    });

    expect(requestLog.length).toBe(1);
    expect(requestLog[0]).toEqual(
      expect.objectContaining({
        method: "POST",
        eventType: "connectionStart",
        connectionId: connectionId,
        body: {
          aggregatorId: "agg1",
          institutionId: "inst1",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
        },
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
          "content-type": expect.stringContaining("application/json"),
        }),
      }),
    );
  });

  it("calls connectionSuccess with correct method and headers and cleans up local performance object", async () => {
    const connectionId = "conn2";
    await setupRedisPerformanceObject(connectionId);

    const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

    await recordSuccessEvent(connectionId);

    await expectPerformanceObject(connectionId, null);

    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionSuccess",
        connectionId: connectionId,
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("calls updateDelayedConnectionId when aggregatorConnectionId is provided and feature is enabled", async () => {
    jest.spyOn(configModule, "getConfig").mockReturnValue({
      ...config,
      CONNECTION_CLEANUP_INTERVAL_MINUTES: 30,
      CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
    });

    const connectionId = "conn2a";
    const aggregatorConnectionId = "aggr-conn-123";
    await setupRedisPerformanceObject(connectionId);

    await setConnectionForCleanup({
      id: connectionId,
      createdAt: Date.now(),
      aggregatorId: "mx",
      userId: "test-user-id",
    });

    const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

    await recordSuccessEvent(connectionId, aggregatorConnectionId);

    await expectPerformanceObject(connectionId, null);

    const storedConnection = await get(`cleanup:${connectionId}`);
    expect(storedConnection).toEqual(
      expect.objectContaining({
        id: connectionId,
        delayedConnectionId: aggregatorConnectionId,
      }),
    );

    expect(requestLog.length).toBe(1);
  });

  it("does not call updateDelayedConnectionId when aggregatorConnectionId is provided but feature is disabled", async () => {
    jest.spyOn(configModule, "getConfig").mockReturnValue({
      ...config,
      CONNECTION_CLEANUP_INTERVAL_MINUTES: undefined,
      CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
    });

    const connectionId = "conn2b";
    const aggregatorConnectionId = "aggr-conn-456";
    await setupRedisPerformanceObject(connectionId);

    await setConnectionForCleanup({
      id: connectionId,
      createdAt: Date.now(),
      aggregatorId: "mx",
      userId: "test-user-id",
    });

    const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

    await recordSuccessEvent(connectionId, aggregatorConnectionId);

    await expectPerformanceObject(connectionId, null);

    const storedConnection = await get(`cleanup:${connectionId}`);
    expect(storedConnection).toEqual(
      expect.objectContaining({
        id: connectionId,
      }),
    );
    expect(storedConnection.delayedConnectionId).toBeUndefined();

    expect(requestLog.length).toBe(1);
  });

  it("does not call updateDelayedConnectionId when aggregatorConnectionId is not provided", async () => {
    jest.spyOn(configModule, "getConfig").mockReturnValue({
      ...config,
      CONNECTION_CLEANUP_INTERVAL_MINUTES: 30,
      CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
    });

    const connectionId = "conn2c";
    await setupRedisPerformanceObject(connectionId);

    await setConnectionForCleanup({
      id: connectionId,
      createdAt: Date.now(),
      aggregatorId: "mx",
      userId: "test-user-id",
    });

    const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

    await recordSuccessEvent(connectionId);

    await expectPerformanceObject(connectionId, null);

    const storedConnection = await get(`cleanup:${connectionId}`);
    expect(storedConnection).toEqual(
      expect.objectContaining({
        id: connectionId,
      }),
    );
    expect(storedConnection.delayedConnectionId).toBeUndefined();

    expect(requestLog.length).toBe(1);
  });

  it("logs warning when trying to update delayedConnectionId for non-existent connection", async () => {
    jest.spyOn(configModule, "getConfig").mockReturnValue({
      ...config,
      CONNECTION_CLEANUP_INTERVAL_MINUTES: 30,
      CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
    });

    const connectionId = "conn2d-non-existent";
    const aggregatorConnectionId = "aggr-conn-789";
    await setupRedisPerformanceObject(connectionId);

    const warningSpy = jest
      .spyOn(logger, "warning")
      .mockImplementation(() => {});
    const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

    await recordSuccessEvent(connectionId, aggregatorConnectionId);

    await expectPerformanceObject(connectionId, null);

    expect(warningSpy).toHaveBeenCalledWith(
      `Connection ${connectionId} not found for delayed update.`,
    );

    expect(requestLog.length).toBe(1);
  });

  it("calls connectionPause with correct method and headers, and updates pause on local performance object", async () => {
    const connectionId = "conn3";
    await setupRedisPerformanceObject(connectionId);

    const requestLog = setupPerformanceHandlers(["connectionPause"]);

    await recordConnectionPauseEvent(connectionId);

    await expectPerformanceObject(connectionId, {
      paused: true,
    });

    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionPause",
        connectionId: connectionId,
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("calls connectionPause with correct method and headers, and doesn't pause local performance object when pauseLocal is false", async () => {
    const connectionId = "conn3.5";
    await setupRedisPerformanceObject(connectionId);

    const requestLog = setupPerformanceHandlers(["connectionPause"]);

    await recordConnectionPauseEvent(connectionId, false);

    await expectPerformanceObject(connectionId, {
      paused: false,
    });

    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionPause",
        connectionId: connectionId,
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("calls connectionResume with correct method and headers, and unpauses local performance object", async () => {
    const connectionId = "conn4";
    await setupRedisPerformanceObject(connectionId);
    await pausePolling(connectionId);
    await expectPerformanceObject(connectionId, {
      paused: true,
    });

    const requestLog = setupPerformanceHandlers(["connectionResume"]);

    await recordConnectionResumeEvent(connectionId);

    await expectPerformanceObject(connectionId, {
      paused: false,
    });

    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionResume",
        connectionId: connectionId,
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("fails if ucp credentials are not configured to get access token", async () => {
    const debugSpy = jest.spyOn(logger, "debug");

    server.use(
      http.post(config.AUTH0_TOKEN_URL, async () => {
        return new HttpResponse(null, {
          status: 401,
          statusText: "Unauthorized",
        });
      }),
    );

    await recordSuccessEvent("conn5");
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "UCP credentials need to be configured for performance features",
      ),
    );
  });

  it("logs error if fetch fails", async () => {
    server.use(
      http.put(
        `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
        () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        },
      ),
    );

    const debugSpy = jest.spyOn(logger, "debug");
    await recordSuccessEvent("conn6");
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Performance event (connectionSuccess) failed: 500 Internal Server Error",
      ),
    );
  });

  it("logs error if fetch throws", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("network fail"));
    const debugSpy = jest.spyOn(logger, "debug");

    await recordSuccessEvent("conn7");
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Performance event (connectionSuccess) failed with error:",
      ),
      expect.any(Error),
    );

    fetchSpy.mockRestore();
  });
});
