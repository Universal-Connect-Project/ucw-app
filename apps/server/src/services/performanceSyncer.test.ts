import { server } from "../test/testServer";
import { clearIntervalAsync } from "set-interval-async";
import { http, HttpResponse } from "msw";
import { getConfig } from "../config";
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
import {
  RESPONSE_NOT_MODIFIED,
  UNAUTHORIZED_RESPONSE,
} from "../infra/http/constants";

describe("setPerformanceSyncSchedule", () => {
  it("should call sync over the given interval", async () => {
    jest.useFakeTimers();
    let pollerCounter = 0;
    server.use(
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
        () => {
          pollerCounter += 1;
          return HttpResponse.json({});
        },
      ),
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
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
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
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
        () =>
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

  it("should throw error when forbidden access", async () => {
    server.use(
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
        () =>
          HttpResponse.json(null, {
            status: UNAUTHORIZED_RESPONSE,
            statusText: "Forbidden",
          }),
      ),
    );

    await expect(syncPerformanceData()).rejects.toThrow(
      "Unauthorized access to performance service. Please check your UCP Client ID and secret.",
    );
  });

  it("should throw error for unexpected non-ok status codes", async () => {
    server.use(
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
        () =>
          new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          }),
      ),
    );

    await expect(syncPerformanceData()).rejects.toThrow(
      "Failed to fetch performance data: Internal Server Error",
    );
  });

  it("should throw error for 404 status code", async () => {
    server.use(
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
        () =>
          new HttpResponse(null, {
            status: 404,
            statusText: "Not Found",
          }),
      ),
    );

    await expect(syncPerformanceData()).rejects.toThrow(
      "Failed to fetch performance data: Not Found",
    );
  });
});

describe("fetchPerformanceData", () => {
  it("returns a response when the server is available", async () => {
    server.use(
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
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
      http.get(
        `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
        () => HttpResponse.error(),
      ),
    );

    await expect(fetchPerformanceData()).rejects.toThrow();
  });
});
