import type { Connection } from "@repo/utils";
import { ConnectionStatus } from "@repo/utils";
import { AggregatorAdapterBase } from "../adapters";
import { del, get, set } from "../services/storageClient/redis";
import { recordSuccessEvent } from "../services/performanceTracking";

export interface PerformanceObject {
  userId?: string;
  connectionId?: string;
  performanceSessionId?: string;
  aggregatorId?: string;
  lastUiUpdateTimestamp?: number;
  pausedByMfa?: boolean;
}

const PERFORMANCE_REDIS_SUBDIRECTORY = "performance";

const performanceRedisKey = (performanceSessionId: string): string => {
  return `${PERFORMANCE_REDIS_SUBDIRECTORY}:${performanceSessionId}`;
};

export const getPerformanceObject = async (
  performanceSessionId: string,
): Promise<PerformanceObject> => {
  return (await get(performanceRedisKey(performanceSessionId))) || {};
};

const updatePerformanceObject = async (
  performanceSessionId: string,
  update: Partial<PerformanceObject>,
): Promise<void> => {
  const performanceObject = await getPerformanceObject(performanceSessionId);
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

export const setPausedByMfa = async (
  performanceSessionId: string,
  paused: boolean,
): Promise<void> => {
  await updatePerformanceObject(performanceSessionId, {
    pausedByMfa: paused,
  });
};

export const createPerformanceObject = async ({
  connectionId,
  userId,
  performanceSessionId,
  aggregatorId,
}: {
  connectionId: string;
  userId: string;
  performanceSessionId: string;
  aggregatorId: string;
}): Promise<void> => {
  await set(
    performanceRedisKey(performanceSessionId),
    {
      userId,
      connectionId,
      performanceSessionId,
      aggregatorId,
      lastUiUpdateTimestamp: Date.now(),
      pausedByMfa: false,
    },
    { EX: 1200 }, // Set expiration time to 20 minutes
  );
};

export const cleanupPerformanceObject = async (
  performanceSessionId: string,
): Promise<void> => {
  await del(performanceRedisKey(performanceSessionId));
};

const getAggregatorConnectionStatus = async (
  performanceSessionId: string,
): Promise<Connection> => {
  const performanceObject = await getPerformanceObject(performanceSessionId);
  const aggregatorAdapter = new AggregatorAdapterBase({
    context: {
      aggregator: performanceObject.aggregatorId,
      resolvedUserId: performanceObject.userId,
    },
  });
  await aggregatorAdapter.init();
  const connectionStatus =
    await aggregatorAdapter.getConnectionStatus(performanceSessionId);
  const connection =
    await aggregatorAdapter.getConnection(performanceSessionId);
  return {
    ...connection,
    status: connectionStatus.status,
  };
};

export const pollConnectionStatusIfNeeded = async (
  performanceSessionId: string,
): Promise<void> => {
  const { lastUiUpdateTimestamp, pausedByMfa } =
    await getPerformanceObject(performanceSessionId);
  if (
    pausedByMfa ||
    (lastUiUpdateTimestamp && Date.now() - lastUiUpdateTimestamp < 1000 * 7) // 7 seconds
  ) {
    // do nothing if the last UI update was within 7 seconds or if paused by MFA
    return;
  }

  const connectionStatus =
    await getAggregatorConnectionStatus(performanceSessionId);
  if (
    connectionStatus.status === ConnectionStatus.CONNECTED &&
    !connectionStatus.is_being_aggregated &&
    !connectionStatus.is_oauth
  ) {
    await recordSuccessEvent(performanceSessionId);
    cleanupPerformanceObject(performanceSessionId);
  } else if (
    connectionStatus.status === ConnectionStatus.IMPEDED ||
    connectionStatus.status === ConnectionStatus.DEGRADED ||
    connectionStatus.status === ConnectionStatus.DISCONNECTED ||
    connectionStatus.status === ConnectionStatus.DISCONTINUE ||
    connectionStatus.status === ConnectionStatus.CLOSED ||
    connectionStatus.status === ConnectionStatus.FAILED
  ) {
    cleanupPerformanceObject(performanceSessionId);
  }
};
