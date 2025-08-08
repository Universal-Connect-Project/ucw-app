import { setIntervalAsync } from "set-interval-async";
import { getConfig } from "../config";
import { info, warning, debug, error } from "../infra/logger";
import { adapterMap } from "../adapterSetup";
import { del, set, get, redisClient } from "../services/storageClient/redis";

interface ConnectionCleanUpObj {
  id: string;
  createdAt: number;
  aggregatorId: string;
  userId: string;
  delayedConnectionId?: string;
  retryCount?: number;
}

const CONNECTION_CLEANUP_REDIS_SUBDIRECTORY = "cleanup";

export const getConnectionCleanUpFeatureEnabled = () =>
  getConfig().CONNECTION_CLEANUP_INTERVAL_MINUTES > 0;

const connectionCleanUpRedisKey = (connectionId: string): string => {
  return `${CONNECTION_CLEANUP_REDIS_SUBDIRECTORY}:${connectionId}`;
};

export const setConnectionForCleanup = async (
  connection: ConnectionCleanUpObj,
): Promise<void> => {
  const key = connectionCleanUpRedisKey(connection.id);
  await set(key, connection);
  debug(`Connection ${connection.id} set for cleanup.`);
};

export const updateDelayedConnectionId = async (
  connectionId: string,
  delayedConnectionId: string,
): Promise<void> => {
  const key = connectionCleanUpRedisKey(connectionId);
  const connection = await get(key);
  if (connection) {
    connection.delayedConnectionId = delayedConnectionId;
    await set(key, connection);
    debug(
      `Updated delayedConnectionId for ${connectionId} to ${delayedConnectionId}`,
    );
  } else {
    warning(`Connection ${connectionId} not found for delayed update.`);
  }
};

const getConnectionsForCleanup = async (): Promise<ConnectionCleanUpObj[]> => {
  const keys = await redisClient.keys(
    `${CONNECTION_CLEANUP_REDIS_SUBDIRECTORY}:*`,
  );
  const connections = await Promise.all(
    keys.map(async (key) => {
      const connection = await get(key);
      return connection;
    }),
  );
  return connections.filter((conn) => conn != null) as ConnectionCleanUpObj[];
};

export async function initCleanUpConnections() {
  if (!getConnectionCleanUpFeatureEnabled()) {
    throw new Error("Connection cleanup is disabled in the configuration.");
  }
  info(
    `Aggregator connections will be automatically deleted after ${getConfig().CONNECTION_CLEANUP_INTERVAL_MINUTES} minutes to prevent ongoing aggregation and unnecessary billing.`,
  );
  return setConnectionCleanUpSchedule(
    getConfig().CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES,
  );
}

async function setConnectionCleanUpSchedule(minutes: number = 10) {
  return setIntervalAsync(
    async () => {
      info("Checking for connection cleanup");
      await cleanUpConnections();
    },
    minutes * 60 * 1000,
  );
}

const cleanUpConnections = async () => {
  const connections: ConnectionCleanUpObj[] = await getConnectionsForCleanup();
  if (connections.length === 0) {
    debug("No connections to clean up.");
    return;
  }

  const now = Date.now();
  const threshold = getConfig().CONNECTION_CLEANUP_INTERVAL_MINUTES * 60 * 1000;

  const expiredConnections = connections.filter(
    (connection) => now - connection.createdAt > threshold,
  );

  if (expiredConnections.length === 0) {
    debug("No expired connections found for cleanup.");
    return;
  }

  debug(`Found ${expiredConnections.length} expired connections for cleanup.`);

  await Promise.all(
    expiredConnections.map((connection) => cleanUpConnection(connection)),
  );

  debug("Connection cleanup process completed.");
  return;
};

const cleanUpConnection = async (connection: ConnectionCleanUpObj) => {
  const aggregatorAdapter =
    adapterMap[connection.aggregatorId].createWidgetAdapter();
  const connectionId = connection.delayedConnectionId || connection.id;
  await aggregatorAdapter
    .DeleteConnection(connectionId, connection.userId)
    .then(async () => {
      info(`Connection ${connectionId} cleaned up successfully.`);
      await del(connectionCleanUpRedisKey(connection.id));
    })
    .catch(async (deleteError) => {
      const currentRetryCount = (connection.retryCount || 0) + 1;

      if (currentRetryCount >= 3) {
        error(
          `Failed to clean up connection after 3 attempts. Removing from cleanup queue. Connection details: ${JSON.stringify(connection)}. Final error: ${deleteError.message}`,
        );
        await del(connectionCleanUpRedisKey(connection.id));
      } else {
        const updatedConnection = {
          ...connection,
          retryCount: currentRetryCount,
        };
        await set(connectionCleanUpRedisKey(connection.id), updatedConnection);
        warning(
          `Failed to clean up connection ${connection.id} (attempt ${currentRetryCount}/3): ${deleteError.message}`,
        );
      }
    });
};
