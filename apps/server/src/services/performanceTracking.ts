import type { ComboJobTypes } from "@repo/utils";
import { getConfig } from "../config";
import { debug } from "../infra/logger";
import { getAccessToken } from "./auth0Service";
import {
  cleanupPerformanceObject,
  pausePolling,
  resumePolling,
} from "../aggregatorPerformanceMeasuring/utils";
import {
  getConnectionCleanUpFeatureEnabled,
  updateDelayedConnectionId,
} from "../connectionCleanup/utils";

async function sendPerformanceEvent({
  connectionId,
  eventType,
  method = "POST",
  body,
}: {
  connectionId: string;
  eventType:
    | "connectionStart"
    | "connectionSuccess"
    | "connectionPause"
    | "connectionResume";
  method?: "POST" | "PUT";
  body?: string;
}) {
  const { PERFORMANCE_SERVICE_URL } = getConfig();

  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      debug("UCP credentials need to be configured for performance features");
      return;
    }

    const url = `${PERFORMANCE_SERVICE_URL}/events/${connectionId}/${eventType}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      debug(
        `Performance event (${eventType}) failed: ${response.status} ${response.statusText} - ${text}`,
      );
    }
  } catch (error) {
    debug(`Performance event (${eventType}) failed with error:`, error);
  }
}

export const recordStartEvent = async ({
  aggregatorId,
  connectionId,
  institutionId,
  jobTypes,
  recordDuration,
}: {
  aggregatorId: string;
  connectionId: string;
  institutionId: string;
  jobTypes: ComboJobTypes[];
  recordDuration?: boolean;
}) => {
  await sendPerformanceEvent({
    connectionId,
    eventType: "connectionStart",
    method: "POST",
    body: JSON.stringify({
      aggregatorId,
      institutionId,
      jobTypes,
      recordDuration,
    }),
  });
};

export const recordSuccessEvent = async (
  performanceSessionId: string,
  aggregatorConnectionId?: string,
) => {
  if (aggregatorConnectionId && getConnectionCleanUpFeatureEnabled()) {
    await updateDelayedConnectionId(
      performanceSessionId,
      aggregatorConnectionId,
    );
  }
  await sendPerformanceEvent({
    connectionId: performanceSessionId,
    eventType: "connectionSuccess",
    method: "PUT",
  });
  cleanupPerformanceObject(performanceSessionId);
};

export const recordConnectionPauseEvent = async (
  connectionId: string,
  shouldPausePolling = true,
) => {
  await sendPerformanceEvent({
    connectionId,
    eventType: "connectionPause",
    method: "PUT",
  });
  if (shouldPausePolling) {
    pausePolling(connectionId);
  }
};

export const recordConnectionResumeEvent = async (connectionId: string) => {
  await sendPerformanceEvent({
    connectionId,
    eventType: "connectionResume",
    method: "PUT",
  });
  resumePolling(connectionId);
};
