import { server } from "../test/testServer";
import {
  createPerformanceObject,
  getPerformanceObject,
  pollConnectionStatusIfNeeded,
  setLastUiUpdateTimestamp,
  setPausedByMfa,
} from "./performanceResilience";
import {
  CONNECTION_BY_ID_PATH,
  READ_MEMBER_STATUS_PATH,
} from "@repo/utils-dev-dependency/mx/handlers";
import { http, HttpResponse } from "msw";
import * as performanceTracking from "./performanceTracking";
import { get } from "js-logger";
import { clearRedisMock } from "../__mocks__/redis";
import { ConnectionStatus } from "@repo/utils";

describe("Performance Resilience", () => {
  const basePerformanceObjectParams = {
    userId: "test-user-id",
    connectionId: "test-connection-id",
    performanceSessionId: "test-session-id",
    aggregatorId: "mx",
  };

  beforeEach(() => {
    clearRedisMock();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should create a performance object", async () => {
    await createPerformanceObject(basePerformanceObjectParams);

    const performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.connectionId,
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
      basePerformanceObjectParams.connectionId,
    );

    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 6000);

    await setLastUiUpdateTimestamp(basePerformanceObjectParams.connectionId);

    const updatedPerformanceObject = await getPerformanceObject(
      basePerformanceObjectParams.connectionId,
    );

    expect(
      updatedPerformanceObject.lastUiUpdateTimestamp -
        initialPerformanceObject.lastUiUpdateTimestamp,
    ).toBeGreaterThan(5000);
  });

  it("should set paused by MFA", async () => {
    await createPerformanceObject(basePerformanceObjectParams);
    const initialPerformanceObject = await getPerformanceObject(
      basePerformanceObjectParams.connectionId,
    );
    expect(initialPerformanceObject.pausedByMfa).toBe(false);

    await setPausedByMfa(basePerformanceObjectParams.connectionId, true);

    const performanceObject = await getPerformanceObject(
      basePerformanceObjectParams.connectionId,
    );

    expect(performanceObject.pausedByMfa).toBe(true);
  });

  describe("pollConnectionStatusIfNeeded", () => {
    it("should clean up the performance object and record success event upon completion", async () => {
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
      );
      await createPerformanceObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 8000);

      const recordSuccessSpy = jest.spyOn(
        performanceTracking,
        "recordSuccessEvent",
      );

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.connectionId,
      );

      const cleanedUpObject = await getPerformanceObject(
        basePerformanceObjectParams.connectionId,
      );
      expect(recordSuccessSpy).toHaveBeenCalledWith(
        basePerformanceObjectParams.performanceSessionId,
      );
      expect(cleanedUpObject).toEqual({});
    });

    it("should not clean up or record event if UI updated recently", async () => {
      await createPerformanceObject(basePerformanceObjectParams);

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 1000); // Only 1s later

      const recordSuccessSpy = jest.spyOn(
        performanceTracking,
        "recordSuccessEvent",
      );

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.connectionId,
      );

      const performanceObject = await getPerformanceObject(
        basePerformanceObjectParams.connectionId,
      );
      expect(performanceObject).toBeDefined();
      expect(recordSuccessSpy).not.toHaveBeenCalled();
    });

    it("should not poll if paused by MFA", async () => {
      await createPerformanceObject(basePerformanceObjectParams);
      await setPausedByMfa(basePerformanceObjectParams.connectionId, true);
      const thing = await getPerformanceObject(
        basePerformanceObjectParams.connectionId,
      );

      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 8000);

      const recordSuccessSpy = jest.spyOn(
        performanceTracking,
        "recordSuccessEvent",
      );

      await pollConnectionStatusIfNeeded(
        basePerformanceObjectParams.connectionId,
      );

      const performanceObject = await getPerformanceObject(
        basePerformanceObjectParams.connectionId,
      );
      expect(performanceObject).toBeDefined();
      expect(recordSuccessSpy).not.toHaveBeenCalled();
    });

    [
      "IMPEDED",
      "DEGRADED",
      "DISCONNECTED",
      "DISCONTINUE",
      "CLOSED",
      "FAILED",
    ].forEach((status) => {
      it(`should clean up on ${status} status`, async () => {
        server.use(
          http.get(READ_MEMBER_STATUS_PATH, () =>
            HttpResponse.json({
              member: {
                guid: "testGuid",
                connection_status: status,
              },
            }),
          ),
        );

        await createPerformanceObject(basePerformanceObjectParams);

        jest.useFakeTimers();
        jest.setSystemTime(Date.now() + 8000);

        await pollConnectionStatusIfNeeded(
          basePerformanceObjectParams.connectionId,
        );

        const recordSuccessSpy = jest.spyOn(
          performanceTracking,
          "recordSuccessEvent",
        );

        expect(recordSuccessSpy).not.toHaveBeenCalled();

        const cleanedUpObject = await getPerformanceObject(
          basePerformanceObjectParams.connectionId,
        );
        expect(cleanedUpObject).toEqual({});
      });
    });
  });
});
