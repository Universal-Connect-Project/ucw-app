import { setIntervalAsync } from "set-interval-async";
import { info, error } from "../infra/logger";
import { getConfig } from "../config";
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

export const getPerformanceEnabled = () => {
  const { UCP_CLIENT_ID, UCP_CLIENT_SECRET } = getConfig();
  return !!(UCP_CLIENT_ID && UCP_CLIENT_SECRET);
};

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
    error(
      "Unable to connect to UCP hosted servers. The UCP Client ID and/or Secret may be invalid. Please check them here: https://app.universalconnectproject.org/widget-management. Performance-based features are disabled until this is resolved.",
    );
    throw new Error("Unable to connect to UCP hosted servers");
  } else if (!response.ok) {
    error(`Failed to fetch performance data: ${response.statusText}`);
    throw new Error(`Failed to fetch performance data: ${response.statusText}`);
  }
};

export async function fetchPerformanceData(): Promise<Response> {
  const performanceCacheETag = await get(PERFORMANCE_ETAG_REDIS_KEY);
  const accessToken = await getAccessToken();
  return await fetch(
    `${getConfig().PERFORMANCE_SERVICE_URL}/metrics/allPerformanceData`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "If-None-Match": performanceCacheETag,
        "Cache-Control": "public",
      },
    },
  );
}
