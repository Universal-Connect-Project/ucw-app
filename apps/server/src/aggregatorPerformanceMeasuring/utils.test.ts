import { server } from "../test/testServer";
import {
  createPerformanceObject,
  getPerformanceObject,
  pollConnectionStatusIfNeeded,
  setLastUiUpdateTimestamp,
  setPausedByMfa,
} from "./utils";
import {
  CONNECTION_BY_ID_PATH,
  READ_MEMBER_STATUS_PATH,
} from "@repo/utils-dev-dependency/mx/handlers";
import { http, HttpResponse } from "msw";
import { ConnectionStatus } from "@repo/utils";
import config, { getConfig } from "../config";

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

  it("should create a performance object", async () => {
    await createPerformanceObject(basePerformanceObjectParams);

    const performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );

    expect(performanceObject).toEqual({
      ...basePerformanceObjectParams,
      lastUiUpdateTimestamp: expect.any(Number),
      pausedByMfa: false,
    });
  });

  it("should update the last UI update timestamp", async () => {
    await createPerformanceObject(basePerformanceObjectParams);

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

  it("should set paused by MFA and update the last UI update timestamp", async () => {
    await createPerformanceObject(basePerformanceObjectParams);
    const initialPerformanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );
    expect(initialPerformanceObject.pausedByMfa).toBe(false);

    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 1000);

    await setPausedByMfa(
      basePerformanceObjectParams.performanceSessionId,
      true,
    );

    const performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.performanceSessionId,
    );

    expect(performanceObject.pausedByMfa).toBe(true);
    expect(performanceObject.lastUiUpdateTimestamp).toBeGreaterThan(
      initialPerformanceObject.lastUiUpdateTimestamp,
    );
  });

  describe("pollConnectionStatusIfNeeded", () => {
    it("should clean up the performance object and record success event upon completion", async () => {
      let performanceSuccessReceived = false;

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
          () => {
            performanceSuccessReceived = true;
            return HttpResponse.json({});
          },
        ),
      );
      await createPerformanceObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 8000);

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      const cleanedUpObject = await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(performanceSuccessReceived).toBeTruthy();
      expect(cleanedUpObject).toEqual({});
    });

    it("should do nothing if the status is PENDING", async () => {
      let performanceSuccessReceived = false;

      server.use(
        http.get(READ_MEMBER_STATUS_PATH, () =>
          HttpResponse.json({
            member: {
              guid: "testGuid",
              connection_status: ConnectionStatus[ConnectionStatus.PENDING],
            },
          }),
        ),
        http.put(
          `${PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
          () => {
            performanceSuccessReceived = true;
            return HttpResponse.json({});
          },
        ),
      );
      await createPerformanceObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 8000);

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

      await createPerformanceObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 1000); // Only 1s later

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.performanceSessionId,
      );

      const performanceObject = await getPerformanceObject(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(performanceObject).toBeDefined();
      expect(performanceSuccessReceived).toBeFalsy();
    });

    it("should not poll if paused by MFA", async () => {
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

      await createPerformanceObject(basePerformanceObjectParams);
      await setPausedByMfa(
        basePerformanceObjectParams.performanceSessionId,
        true,
      );
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

        await createPerformanceObject(basePerformanceObjectParams);

        jest.useFakeTimers();
        jest.setSystemTime(Date.now() + 8000);

        await pollConnectionStatusIfNeeded(
          basePerformanceObjectParams.performanceSessionId,
        );

        expect(performanceSuccessReceived).toBeFalsy();

        const cleanedUpObject = await getPerformanceObject(
          basePerformanceObjectParams.performanceSessionId,
        );
        expect(cleanedUpObject).toEqual({});
      });
    });
  });
});
