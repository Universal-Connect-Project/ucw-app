import type { ComboJobTypes } from "@repo/utils";
import type { Request } from "express";
import { getConfig } from "../config";
import { debug } from "../infra/logger";
import {
  cleanupPerformanceObject,
  pausePolling,
  resumePolling,
} from "../aggregatorPerformanceMeasuring/utils";
import {
  getConnectionCleanUpFeatureEnabled,
  addConnectionIdToCleanupObject,
} from "../connectionCleanup/utils";
import { setPerformanceSessionIdOnContext } from "../shared/utils/context";
import { getUCPAccessToken } from "../shared/utils/ucpAccessToken";

export const setPerformanceSessionId = (req: Request) => {
  const performanceSessionId = crypto.randomUUID();

  setPerformanceSessionIdOnContext({ performanceSessionId, req });

  return performanceSessionId;
};

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
    | "connectionResume"
    | "updateDuration";
  method?: "POST" | "PUT";
  body?: string;
}) {
  const { PERFORMANCE_SERVICE_URL } = getConfig();

  try {
    const accessToken = await getUCPAccessToken();

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
    } else {
      debug(`Performance event (${eventType}) sent successfully`);
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
      shouldRecordResult: false,
    }),
  });
};

export const recordSuccessEvent = async (
  performanceSessionId: string,
  aggregatorConnectionId?: string,
) => {
  if (aggregatorConnectionId && getConnectionCleanUpFeatureEnabled()) {
    await addConnectionIdToCleanupObject(
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

export const recordConnectionPauseEvent = async ({
  connectionId,
  shouldPausePolling = true,
  shouldRecordResult,
}: {
  connectionId: string;
  shouldPausePolling?: boolean;
  shouldRecordResult?: boolean;
}) => {
  await sendPerformanceEvent({
    body: JSON.stringify({
      shouldRecordResult,
    }),
    connectionId,
    eventType: "connectionPause",
    method: "PUT",
  });
  if (shouldPausePolling) {
    pausePolling(connectionId);
  }
};

export const recordConnectionResumeEvent = async ({
  connectionId,
  shouldRecordResult,
}: {
  connectionId: string;
  shouldRecordResult?: boolean;
}) => {
  await sendPerformanceEvent({
    body: JSON.stringify({
      shouldRecordResult,
    }),
    connectionId,
    eventType: "connectionResume",
    method: "PUT",
  });
  resumePolling(connectionId);
};

export const updateConnectionDuration = async ({
  connectionId,
  additionalDuration,
}: {
  connectionId: string;
  additionalDuration: number;
}) => {
  await sendPerformanceEvent({
    body: JSON.stringify({
      additionalDuration,
    }),
    connectionId,
    eventType: "updateDuration",
    method: "PUT",
  });
};
