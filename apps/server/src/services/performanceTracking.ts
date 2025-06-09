import type { ComboJobTypes } from "@repo/utils";
import { getConfig } from "../config";
import { debug } from "../infra/logger";
import { getAccessToken } from "./auth0Service";

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

export const recordSuccessEvent = async (connectionId: string) => {
  await sendPerformanceEvent({
    connectionId,
    eventType: "connectionSuccess",
    method: "PUT",
  });
};

export const recordConnectionPauseEvent = async (connectionId: string) => {
  await sendPerformanceEvent({
    connectionId,
    eventType: "connectionPause",
    method: "PUT",
  });
};
export const recordConnectionResumeEvent = async (connectionId: string) => {
  await sendPerformanceEvent({
    connectionId,
    eventType: "connectionResume",
    method: "PUT",
  });
};
