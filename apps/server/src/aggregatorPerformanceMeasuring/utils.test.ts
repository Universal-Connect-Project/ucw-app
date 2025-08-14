import { server } from "../test/testServer";
import {
  createPerformancePollingObject,
  getPerformanceObject,
  pollConnectionStatusIfNeeded,
  setLastUiUpdateTimestamp,
  pausePolling,
  setPerformanceResiliencePoller,
  UI_UPDATE_THRESHOLD,
  resumePolling,
} from "./utils";
import {
  CONNECTION_BY_ID_PATH,
  READ_MEMBER_STATUS_PATH,
} from "@repo/utils-dev-dependency/mx/handlers";
import { http, HttpResponse } from "msw";
import { ConnectionStatus } from "@repo/utils";
import config, { getConfig } from "../config";
import * as logger from "../infra/logger";
import { clearIntervalAsync } from "set-interval-async";
import expectPerformanceObject from "../test/expectPerformanceObject";

describe("Performance Resilience", () => {
  const { PERFORMANCE_SERVICE_URL } = getConfig();
  const basePerformanceObjectParams = {
    userId: "test-user-id",
    connectionId: "test-connection-id",
    performanceSessionId: "test-session-id",
    aggregatorId: "mx",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("pausePolling & resumePolling", () => {
    it("should pause and resume a performance object successfully", async () => {
      await createPerformancePollingObject(basePerformanceObjectParams);
      expectPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
        { paused: false },
      );

      await pausePolling(basePerformanceObjectParams.performanceSessionId);
      expectPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
        { paused: true },
      );

      await resumePolling(basePerformanceObjectParams.performanceSessionId);
      expectPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
        { paused: false },
      );
    });
  });

  it("should create a performance object which gets deleted after 20 minutes", async () => {
    await createPerformancePollingObject(basePerformanceObjectParams);

    let performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );

    expect(performanceObject).toEqual({
      ...basePerformanceObjectParams,
      lastUiUpdateTimestamp: expect.any(Number),
      paused: false,
    });

    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 1205000); // ~ 20 minutes later

    performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );
    expect(performanceObject).toBeUndefined();
  });

  it("should update the last UI update timestamp", async () => {
    await createPerformancePollingObject(basePerformanceObjectParams);

    const initialPerformanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );

    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 6000);

    await setLastUiUpdateTimestamp(
      basePerformanceObjectParams.performanceSessionId,
    );

    const updatedPerformanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );

    expect(
      updatedPerformanceObject.lastUiUpdateTimestamp -
        initialPerformanceObject.lastUiUpdateTimestamp,
    ).toBeGreaterThan(5000);
  });

  it("logs an error when updating a non-existent performance object", async () => {
    const spy = jest.spyOn(logger, "error").mockImplementation(() => {});

    const fakeSessionId = "does-not-exist";
    await setLastUiUpdateTimestamp(fakeSessionId);

    expect(spy).toHaveBeenCalledWith(
      `Performance object not found for ID: ${fakeSessionId}`,
    );

    const performanceObject = await getPerformanceObject(fakeSessionId);
    expect(performanceObject).toBeUndefined();

    spy.mockRestore();
  });

  it("should set paused and update the last UI update timestamp", async () => {
    await createPerformancePollingObject(basePerformanceObjectParams);
    const initialPerformanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );
    expect(initialPerformanceObject.paused).toBe(false);

    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 1000);

    await pausePolling(basePerformanceObjectParams.performanceSessionId);

    const performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );

    expect(performanceObject.paused).toBe(true);
    expect(performanceObject.lastUiUpdateTimestamp).toBeGreaterThan(
      initialPerformanceObject.lastUiUpdateTimestamp,
    );
  });

  describe("pollConnectionStatusIfNeeded", () => {
    it("should clean up the performance object and record success event with the performance session id upon completion", async () => {
      let performanceSuccessReceived = false;
      let performanceCallId: string | readonly string[];

      server.use(
        http.get(CONNECTION_BY_ID_PATH, () =>
          HttpResponse.json({
            member: {
              guid: "testGuid",
              is_being_aggregated: false,
              is_oauth: false,
            },
          }),
        ),
        http.put(
          `${PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
          ({ params }) => {
            performanceSuccessReceived = true;
            performanceCallId = params.connectionId;
            return HttpResponse.json({});
          },
        ),
      );
      await createPerformancePollingObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + UI_UPDATE_THRESHOLD + 1000);

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      const cleanedUpObject = await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(performanceSuccessReceived).toBeTruthy();
      expect(cleanedUpObject).toBeUndefined();
      expect(performanceCallId).toBe(
        basePerformanceObjectParams.performanceSessionId,
      );
    });

    it("should call resume performance event if status is connected but it's still aggregating", async () => {
      let performanceResumeReceived = false;
      let performanceCallId: string | readonly string[];

      server.use(
        http.get(CONNECTION_BY_ID_PATH, () =>
          HttpResponse.json({
            member: {
              guid: "testGuid",
              is_being_aggregated: true,
              is_oauth: false,
            },
          }),
        ),
        http.put(
          `${PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionResume`,
          ({ params }) => {
            performanceResumeReceived = true;
            performanceCallId = params.connectionId;
            return HttpResponse.json({});
          },
        ),
      );
      await createPerformancePollingObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + UI_UPDATE_THRESHOLD + 1000);

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      expect(performanceResumeReceived).toBeTruthy();
      const performanceObject = expectPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
        {
          paused: false,
        },
      );
      expect(performanceObject).toBeDefined();
      expect(performanceCallId).toBe(
        basePerformanceObjectParams.performanceSessionId,
      );
    });

    it("should use connectionId to get status and do nothing if the status is PENDING", async () => {
      let performanceSuccessReceived = false;
      let statusMemberGuid: string | readonly string[];

      server.use(
        http.get(READ_MEMBER_STATUS_PATH, ({ params }) => {
          statusMemberGuid = params.id;
          return HttpResponse.json({
            member: {
              guid: "testGuid",
              connection_status: ConnectionStatus[ConnectionStatus.PENDING],
            },
          });
        }),
        http.put(
          `${PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
          () => {
            performanceSuccessReceived = true;
            return HttpResponse.json({});
          },
        ),
      );
      await createPerformancePollingObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + UI_UPDATE_THRESHOLD + 1000);

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      const undeletedObject = await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(performanceSuccessReceived).toBeFalsy();
      expect(undeletedObject.performanceSessionId).toBe(
        basePerformanceObjectParams.performanceSessionId,
      );

      expect(statusMemberGuid).toBe(basePerformanceObjectParams.connectionId);
    });

    it("should not clean up or record event if UI updated recently", async () => {
      let performanceSuccessReceived = false;
      server.use(
        http.put(
          `${PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
          () => {
            performanceSuccessReceived = true;
            return HttpResponse.json({});
          },
        ),
      );

      await createPerformancePollingObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + UI_UPDATE_THRESHOLD - 500);

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      const performanceObject = await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(performanceObject).toBeDefined();
      expect(performanceSuccessReceived).toBeFalsy();
    });

    it("should not poll if paused", async () => {
      let performanceSuccessReceived = false;
      server.use(
        http.put(
          `${PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
          () => {
            performanceSuccessReceived = true;
            return HttpResponse.json({});
          },
        ),
      );

      await createPerformancePollingObject(basePerformanceObjectParams);
      await pausePolling(basePerformanceObjectParams.performanceSessionId);
      await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 8000);

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      const performanceObject = await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(performanceObject).toBeDefined();
      expect(performanceSuccessReceived).toBeFalsy();
    });

    [
      ConnectionStatus[ConnectionStatus.IMPEDED],
      ConnectionStatus[ConnectionStatus.DEGRADED],
      ConnectionStatus[ConnectionStatus.DISCONNECTED],
      ConnectionStatus[ConnectionStatus.DISCONTINUE],
      ConnectionStatus[ConnectionStatus.CLOSED],
      ConnectionStatus[ConnectionStatus.FAILED],
    ].forEach((status) => {
      it(`should clean up on ${status} status`, async () => {
        let performanceSuccessReceived = false;
        server.use(
          http.get(READ_MEMBER_STATUS_PATH, () =>
            HttpResponse.json({
              member: {
                guid: "testGuid",
                connection_status: status,
              },
            }),
          ),
          http.put(
            `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
            () => {
              performanceSuccessReceived = true;
              return HttpResponse.json({});
            },
          ),
        );

        await createPerformancePollingObject(basePerformanceObjectParams);

        jest.useFakeTimers();
        jest.setSystemTime(Date.now() + 8000);

        await pollConnectionStatusIfNeeded(
          basePerformanceObjectParams.performanceSessionId,
        );

        expect(performanceSuccessReceived).toBeFalsy();

        const cleanedUpObject = await getPerformanceObject(
          basePerformanceObjectParams.performanceSessionId,
        );
        expect(cleanedUpObject).toBeUndefined();
      });
    });
  });

  describe("setPerformanceResiliencePoller", () => {
    const basePerformanceObject = {
      userId: "test-user-id",
      connectionId: "test-connection-id",
      performanceSessionId: "test-session-id",
      aggregatorId: "mx",
    };
    let polledIds: string[];

    beforeEach(() => {
      jest.restoreAllMocks();
      jest.useFakeTimers();
      polledIds = [];

      server.use(
        http.get(READ_MEMBER_STATUS_PATH, ({ params }) => {
          polledIds.push(String(params.id));
          return HttpResponse.json({
            member: {
              guid: "testGuid",
              connection_status: ConnectionStatus[ConnectionStatus.PENDING],
            },
          });
        }),
      );
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("should poll for status after UI_UPDATE_THRESHOLD seconds", async () => {
      await createPerformancePollingObject(basePerformanceObject);

      const poller = await setPerformanceResiliencePoller(1);

      jest.advanceTimersByTime(UI_UPDATE_THRESHOLD + 1500);

      await clearIntervalAsync(poller);

      expect(polledIds).toContain(basePerformanceObject.connectionId);
    });

    it("should NOT poll for status before UI_UPDATE_THRESHOLD seconds", async () => {
      await createPerformancePollingObject(basePerformanceObject);

      const poller = await setPerformanceResiliencePoller(1);

      jest.advanceTimersByTime(UI_UPDATE_THRESHOLD - 500);

      await clearIntervalAsync(poller);

      expect(polledIds).not.toContain(basePerformanceObject.connectionId);
    });

    it("should poll for multiple performance objects", async () => {
      const fakeSessionId1 = "test-session-id";
      const fakeSessionId2 = "test-session-id2";
      const fakeConnectionId1 = "conn1";
      const fakeConnectionId2 = "conn2";

      await createPerformancePollingObject({
        ...basePerformanceObject,
        performanceSessionId: fakeSessionId1,
        connectionId: fakeConnectionId1,
      });

      await createPerformancePollingObject({
        ...basePerformanceObject,
        performanceSessionId: fakeSessionId2,
        connectionId: fakeConnectionId2,
      });

      const poller = await setPerformanceResiliencePoller(1);

      jest.advanceTimersByTime(UI_UPDATE_THRESHOLD);

      await clearIntervalAsync(poller);

      expect(polledIds).toContain(fakeConnectionId1);
      expect(polledIds).toContain(fakeConnectionId2);
    });

    it("should poll repeatedly on interval", async () => {
      jest.useRealTimers();
      await createPerformancePollingObject(basePerformanceObject);

      const poller = await setPerformanceResiliencePoller(1);

      await new Promise((r) => setTimeout(r, UI_UPDATE_THRESHOLD + 3000));

      await clearIntervalAsync(poller);

      expect(
        polledIds.filter((id) => id === basePerformanceObject.connectionId)
          .length,
      ).toBeGreaterThan(1);
    });
  });
});
