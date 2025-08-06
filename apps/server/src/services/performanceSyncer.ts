import { setIntervalAsync } from "set-interval-async";
import { info } from "../infra/logger";
import config from "../config";
import { getAccessToken } from "./auth0Service";
import {
  RESPONSE_NOT_MODIFIED,
  SUCCESS_RESPONSE,
  UNAUTHORIZED_RESPONSE,
} from "../infra/http/constants";
import {
  PERFORMANCE_DATA_REDIS_KEY,
  PERFORMANCE_ETAG_REDIS_KEY,
} from "./storageClient/constants";
import { get, setNoExpiration } from "./storageClient/redis";

export async function setPerformanceSyncSchedule(minutes: number = 10) {
  return setIntervalAsync(
    async () => {
      info("Checking for performance data updates");
      await syncPerformanceData();
    },
    minutes * 60 * 1000,
  );
}

export const syncPerformanceData = async () => {
  const response = await fetchPerformanceData();
  if (response.status === RESPONSE_NOT_MODIFIED) {
    info("Performance data unchanged. Skipping Update");
  } else if (response.status === SUCCESS_RESPONSE) {
    const performanceData = await response.json();
    await setNoExpiration(PERFORMANCE_DATA_REDIS_KEY, performanceData);
    info("Updating performance routing data");
    await setNoExpiration(
      PERFORMANCE_ETAG_REDIS_KEY,
      response.headers.get("etag"),
    );
  } else if (response.status === UNAUTHORIZED_RESPONSE) {
    throw new Error(
      "Unauthorized access to performance service. Please check your UCP Client ID and secret.",
    );
  } else if (!response.ok) {
    throw new Error(`Failed to fetch performance data: ${response.statusText}`);
  }
};

export async function fetchPerformanceData(): Promise<Response> {
  const performanceCacheETag = await get(PERFORMANCE_ETAG_REDIS_KEY);
  const accessToken = await getAccessToken();
  return await fetch(
    `${config.PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "If-None-Match": performanceCacheETag,
        "Cache-Control": "public",
      },
    },
  );
}
