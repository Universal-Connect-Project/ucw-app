import type { Connection } from "@repo/utils";
import { ConnectionStatus } from "@repo/utils";
import { AggregatorAdapterBase } from "../adapters";
import { del, get, set } from "./storageClient/redis";
import { recordSuccessEvent } from "./performanceTracking";

interface PerformanceObject {
  userId?: string;
  connectionId?: string;
  performanceSessionId?: string;
  aggregatorId?: string;
  lastUiUpdateTimestamp?: number;
  pausedByMfa?: boolean;
}

const PERFORMANCE_REDIS_SUBDIRECTORY = "performance";

export const getPerformanceObject = async (
  connectionId: string,
): Promise<PerformanceObject> => {
  return (await get(`${PERFORMANCE_REDIS_SUBDIRECTORY}:${connectionId}`)) || {};
};

const updatePerformanceObject = async (
  connectionId: string,
  update: Partial<PerformanceObject>,
): Promise<void> => {
  const performanceObject = await getPerformanceObject(connectionId);
  Object.assign(performanceObject, update);
  await set(
    `${PERFORMANCE_REDIS_SUBDIRECTORY}:${connectionId}`,
    performanceObject,
  );
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
  await set(`${PERFORMANCE_REDIS_SUBDIRECTORY}:${connectionId}`, {
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
  await del(`${PERFORMANCE_REDIS_SUBDIRECTORY}:${connectionId}`);
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
    recordSuccessEvent(performanceSessionId);
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
