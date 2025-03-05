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
import { get, set } from "./storageClient/redis";
import * as logger from "../infra/logger";
import {
  RESPONSE_NOT_MODIFIED,
  UNAUTHORIZED_RESPONSE,
} from "src/infra/http/constants";

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
    const performanceData = {
      test: {
        things: "test",
      },
    };

    await set(PERFORMANCE_DATA_REDIS_KEY, performanceData);

    server.use(
      http.get(
        config.PERFORMANCE_ROUTING_DATA_URL,
        () =>
          new HttpResponse(null, {
            status: RESPONSE_NOT_MODIFIED,
            statusText: "Not Modified",
          }),
      ),
    );

    await syncPerformanceData();

    expect(await get(PERFORMANCE_DATA_REDIS_KEY)).toStrictEqual(
      performanceData,
    );
  });

  it("should set the etag and store performance data if response is 200", async () => {
    const performanceRoutingData = {
      "1234-32432": {
        transactions: {
          successRate: {
            mx: 65,
          },
        },
      },
    };

    const fakeEtag = "12345abcde";

    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () =>
        HttpResponse.json(performanceRoutingData, {
          headers: {
            etag: fakeEtag,
          },
        }),
      ),
    );

    await syncPerformanceData();

    expect(await get(PERFORMANCE_ETAG_REDIS_KEY)).toBe(fakeEtag);
    expect(await get(PERFORMANCE_DATA_REDIS_KEY)).toStrictEqual(
      performanceRoutingData,
    );
  });

  it("should log warning message when forbidden access", async () => {
    const warningLogSpy = jest.spyOn(logger, "warning");

    server.use(
      http.get(config.PERFORMANCE_ROUTING_DATA_URL, () =>
        HttpResponse.json(null, {
          status: UNAUTHORIZED_RESPONSE,
          statusText: "Forbidden",
        }),
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
          new HttpResponse(null, {
            status: UNAUTHORIZED_RESPONSE,
            statusText: "Not Modified",
          }),
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
