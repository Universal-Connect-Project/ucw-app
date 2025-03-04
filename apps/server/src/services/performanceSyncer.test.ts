import { server } from "../test/testServer";
import { clearIntervalAsync } from "set-interval-async";
import { http, HttpResponse } from "msw";
import config from "../config";
import {
  fetchPerformanceData,
  setPerformanceSyncSchedule,
  syncPerformanceData,
} from "./performanceSyncer";
import {
  PERFORMANCE_DATA_REDIS_KEY,
  PERFORMANCE_ETAG_REDIS_KEY,
} from "./storageClient/constants";
import { get } from "./storageClient/redis";
import * as logger from "../infra/logger";

describe("setPerformanceSyncSchedule", () => {
  it("should call sync over the given interval", async () => {
    jest.useFakeTimers();
    let pollerCounter = 0;
    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () => {
        pollerCounter += 1;
        return HttpResponse.json({});
      }),
    );

    const poller = await setPerformanceSyncSchedule(0.25);

    expect(pollerCounter).toEqual(0);

    await jest.advanceTimersByTimeAsync(15000);
    expect(pollerCounter).toEqual(1);

    await jest.advanceTimersByTimeAsync(15000);
    expect(pollerCounter).toEqual(2);
    await clearIntervalAsync(poller);
    jest.useRealTimers();
  });
});

describe("syncPerformanceData", () => {
  it("should skip update if response status is 304 (not modified)", async () => {
    const infoLogSpy = jest.spyOn(logger, "info");

    server.use(
      http.get(
        config.PERFORMANCE_ROUTING_DATA_URL,
        () =>
          new HttpResponse(null, { status: 304, statusText: "Not Modified" }),
      ),
    );

    await syncPerformanceData();

    expect(infoLogSpy).toHaveBeenCalledWith(
      "Performance data unchanged. Skipping Update",
    );
  });

  it("should call update methods if response is 200", async () => {
    const performanceRoutingData = {
      "1234-32432": {
        transactions: {
          successRate: {
            mx: 65,
          },
        },
      },
    };

    const mockEtag = "12345abcde";

    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () =>
        HttpResponse.json(performanceRoutingData, {
          headers: {
            etag: mockEtag,
          },
        }),
      ),
    );

    await syncPerformanceData();

    expect(await get(PERFORMANCE_ETAG_REDIS_KEY)).toBe(mockEtag);
    expect(await get(PERFORMANCE_DATA_REDIS_KEY)).toStrictEqual(
      performanceRoutingData,
    );
  });

  it("should log warning message when forbidden access", async () => {
    const warningLogSpy = jest.spyOn(logger, "warning");

    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () =>
        HttpResponse.json(null, { status: 401, statusText: "Forbidden" }),
      ),
    );

    await syncPerformanceData();

    expect(warningLogSpy).toHaveBeenCalledWith(
      "Unauthorized access to performance service",
    );
  });

  it("should fail gracefully when fetch fails", async () => {
    const warningLogSpy = jest.spyOn(logger, "warning");

    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () => HttpResponse.error()),
    );

    await syncPerformanceData();

    expect(warningLogSpy).toHaveBeenCalledWith(
      "Unable to get performance data from server: Failed to fetch",
    );
  });
});

describe("fetchPerformanceData", () => {
  it("returns a response when the server is available", async () => {
    server.use(
      http.get(
        config.PERFORMANCE_ROUTING_DATA_URL,
        () =>
          new HttpResponse(null, { status: 304, statusText: "Not Modified" }),
      ),
    );

    const response = await fetchPerformanceData();
    expect(response).not.toBeNull();
  });

  it("Throws an error when the server is unavailable", async () => {
    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () => HttpResponse.error()),
    );

    await expect(fetchPerformanceData()).rejects.toThrow();
  });
});
