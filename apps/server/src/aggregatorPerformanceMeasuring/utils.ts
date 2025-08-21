import type { Connection } from "@repo/utils";
import { ConnectionStatus } from "@repo/utils";
import { AggregatorAdapterBase } from "../adapters";
import { del, get, set } from "../services/storageClient/redis";
import {
  recordConnectionResumeEvent,
  recordSuccessEvent,
} from "../services/performanceTracking";
import { debug, error, info } from "../infra/logger";
import { performanceResilienceManager } from "./performanceResilienceManager";

export interface PerformanceObject {
  userId?: string;
  connectionId?: string;
  performanceSessionId?: string;
  aggregatorId?: string;
  lastUiUpdateTimestamp?: number;
  paused?: boolean;
  jobId?: string;
}

export const PERFORMANCE_REDIS_SUBDIRECTORY = "performance";

const performanceRedisKey = (performanceSessionId: string): string => {
  return `${PERFORMANCE_REDIS_SUBDIRECTORY}:${performanceSessionId}`;
};

export const getPerformanceObject = async (
  performanceSessionId: string,
): Promise<PerformanceObject> => {
  return await get(performanceRedisKey(performanceSessionId));
};

const updatePerformanceObject = async (
  performanceSessionId: string,
  update: Partial<PerformanceObject>,
): Promise<void> => {
  const performanceObject = await getPerformanceObject(performanceSessionId);
  if (!performanceObject) {
    error(`Performance object not found for ID: ${performanceSessionId}`);
    return;
  }
  Object.assign(performanceObject, {
    ...update,
    lastUiUpdateTimestamp: Date.now(),
  });
  await set(performanceRedisKey(performanceSessionId), performanceObject);
};

export const setLastUiUpdateTimestamp = async (
  performanceSessionId: string,
): Promise<void> => {
  await updatePerformanceObject(performanceSessionId, {
    lastUiUpdateTimestamp: Date.now(),
  });
};

export const pausePolling = async (
  performanceSessionId: string,
): Promise<void> => {
  await updatePerformanceObject(performanceSessionId, {
    paused: true,
  });
};

export const resumePolling = async (
  performanceSessionId: string,
): Promise<void> => {
  await updatePerformanceObject(performanceSessionId, {
    paused: false,
  });
};

export const createPerformancePollingObject = async ({
  connectionId,
  userId,
  performanceSessionId,
  aggregatorId,
  jobId,
}: {
  connectionId: string;
  userId: string;
  performanceSessionId: string;
  aggregatorId: string;
  jobId?: string;
}): Promise<void> => {
  await set(
    performanceRedisKey(performanceSessionId),
    {
      userId,
      connectionId,
      performanceSessionId,
      aggregatorId,
      lastUiUpdateTimestamp: Date.now(),
      paused: false,
      jobId,
    },
    { EX: 1200 }, // Set expiration time to 20 minutes
  );

  await performanceResilienceManager.addSession(performanceSessionId);
};

export const cleanupPerformanceObject = async (
  performanceSessionId: string,
): Promise<void> => {
  await del(performanceRedisKey(performanceSessionId));

  await performanceResilienceManager.removeSession(performanceSessionId);
};

const getAggregatorConnectionStatus = async ({
  aggregatorId,
  userId,
  connectionId,
  jobId,
}: PerformanceObject): Promise<Connection> => {
  const aggregatorAdapter = new AggregatorAdapterBase({
    context: {
      aggregator: aggregatorId,
      resolvedUserId: userId,
      current_job_id: jobId,
    },
  });
  await aggregatorAdapter.init();
  const connectionStatus =
    await aggregatorAdapter.getConnectionStatus(connectionId);
  const connection = await aggregatorAdapter.getConnection(connectionId);
  return {
    ...connection,
    status: connectionStatus.status,
  };
};

export const UI_UPDATE_THRESHOLD =
  process.env.NODE_ENV === "test" ? 1000 : 7000; // 1 second for tests, 7 seconds otherwise

export const pollConnectionStatusIfNeeded = async (
  performanceSessionId: string,
): Promise<void> => {
  const performanceObject = await getPerformanceObject(performanceSessionId);

  if (!performanceObject) {
    debug(
      `Performance object not found for ${performanceSessionId} (likely TTL expired), publishing session_removed event`,
    );
    await performanceResilienceManager.removeSession(performanceSessionId);
    return;
  }

  const {
    lastUiUpdateTimestamp,
    paused,
    aggregatorId,
    userId,
    connectionId,
    jobId,
  } = performanceObject;

  if (
    paused ||
    (lastUiUpdateTimestamp &&
      Date.now() - lastUiUpdateTimestamp < UI_UPDATE_THRESHOLD)
  ) {
    // do nothing if the last UI update was within the threshold or if paused by MFA
    return;
  }

  info(`Polling connection status for ${performanceSessionId}`);

  const connectionStatus = await getAggregatorConnectionStatus({
    aggregatorId,
    userId,
    connectionId,
    jobId,
  });

  if (
    connectionStatus.status === ConnectionStatus.CONNECTED &&
    connectionStatus.is_being_aggregated
  ) {
    await recordConnectionResumeEvent(performanceSessionId);
  } else if (
    connectionStatus.status === ConnectionStatus.CONNECTED &&
    !connectionStatus.is_being_aggregated
  ) {
    await recordSuccessEvent(performanceSessionId);
  } else if (
    connectionStatus.status === ConnectionStatus.IMPEDED ||
    connectionStatus.status === ConnectionStatus.DEGRADED ||
    connectionStatus.status === ConnectionStatus.DISCONNECTED ||
    connectionStatus.status === ConnectionStatus.DISCONTINUE ||
    connectionStatus.status === ConnectionStatus.CLOSED ||
    connectionStatus.status === ConnectionStatus.FAILED
  ) {
    await cleanupPerformanceObject(performanceSessionId);
  }
};
