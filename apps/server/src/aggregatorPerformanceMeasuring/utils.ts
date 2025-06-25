import type { Connection } from "@repo/utils";
import { ConnectionStatus } from "@repo/utils";
import { AggregatorAdapterBase } from "../adapters";
import { del, get, set } from "../services/storageClient/redis";
import { recordSuccessEvent } from "../services/performanceTracking";

interface PerformanceObject {
  userId?: string;
  connectionId?: string;
  performanceSessionId?: string;
  aggregatorId?: string;
  lastUiUpdateTimestamp?: number;
  pausedByMfa?: boolean;
}

const PERFORMANCE_REDIS_SUBDIRECTORY = "performance";

const performanceRedisKey = (connectionId: string): string => {
  return `${PERFORMANCE_REDIS_SUBDIRECTORY}:${connectionId}`;
};

export const getPerformanceObject = async (
  connectionId: string,
): Promise<PerformanceObject> => {
  return (await get(performanceRedisKey(connectionId))) || {};
};

const updatePerformanceObject = async (
  connectionId: string,
  update: Partial<PerformanceObject>,
): Promise<void> => {
  const performanceObject = await getPerformanceObject(connectionId);
  Object.assign(performanceObject, update);
  await set(performanceRedisKey(connectionId), performanceObject);
};

export const setLastUiUpdateTimestamp = async (
  connectionId: string,
): Promise<void> => {
  await updatePerformanceObject(connectionId, {
    lastUiUpdateTimestamp: Date.now(),
  });
};

export const setPausedByMfa = async (
  connectionId: string,
  paused: boolean,
): Promise<void> => {
  await updatePerformanceObject(connectionId, {
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
  await set(performanceRedisKey(connectionId), {
    userId,
    connectionId,
    performanceSessionId,
    aggregatorId,
    lastUiUpdateTimestamp: Date.now(),
    pausedByMfa: false,
  });
};

const cleanupPerformanceObject = async (
  connectionId: string,
): Promise<void> => {
  await del(performanceRedisKey(connectionId));
};

const getAggregatorConnectionStatus = async (
  connectionId: string,
): Promise<Connection> => {
  const performanceObject = await getPerformanceObject(connectionId);
  const aggregatorAdapter = new AggregatorAdapterBase({
    context: {
      aggregator: performanceObject.aggregatorId,
      resolvedUserId: performanceObject.userId,
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

export const pollConnectionStatusIfNeeded = async (
  connectionId: string,
): Promise<void> => {
  const { lastUiUpdateTimestamp, pausedByMfa, performanceSessionId } =
    await getPerformanceObject(connectionId);
  if (
    pausedByMfa ||
    (lastUiUpdateTimestamp && Date.now() - lastUiUpdateTimestamp < 1000 * 7) // 7 seconds
  ) {
    // do nothing if the last UI update was within 7 seconds or if paused by MFA
    return;
  }

  const connectionStatus = await getAggregatorConnectionStatus(connectionId);
  if (
    connectionStatus.status === ConnectionStatus.CONNECTED &&
    !connectionStatus.is_being_aggregated &&
    !connectionStatus.is_oauth
  ) {
    await recordSuccessEvent(performanceSessionId);
    cleanupPerformanceObject(connectionId);
  } else if (
    connectionStatus.status === ConnectionStatus.IMPEDED ||
    connectionStatus.status === ConnectionStatus.DEGRADED ||
    connectionStatus.status === ConnectionStatus.DISCONNECTED ||
    connectionStatus.status === ConnectionStatus.DISCONTINUE ||
    connectionStatus.status === ConnectionStatus.CLOSED ||
    connectionStatus.status === ConnectionStatus.FAILED
  ) {
    cleanupPerformanceObject(connectionId);
  }
};
