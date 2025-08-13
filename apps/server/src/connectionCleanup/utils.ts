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
  connectionId?: string;
  retryCount?: number;
}

const CONNECTION_CLEANUP_REDIS_SUBDIRECTORY = "cleanup";

export const getConnectionCleanUpFeatureEnabled = () =>
  getConfig().CONNECTION_EXPIRATION_MINUTES > 0;

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

export const addConnectionIdToCleanupObject = async (
  id: string,
  delayedConnectionId: string,
): Promise<void> => {
  const key = connectionCleanUpRedisKey(id);
  const connection = await get(key);
  if (connection) {
    connection.connectionId = delayedConnectionId;
    connection.createdAt = Date.now();
    await set(key, connection);
    debug(`Updated connectionId for ${id} to ${delayedConnectionId}`);
  } else {
    warning(`Connection ${id} not found for delayed update.`);
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
  info(
    `Aggregator connections will automatically be deleted after ${getConfig().CONNECTION_EXPIRATION_MINUTES} minutes to prevent ongoing aggregation and unnecessary billing.`,
  );
  return setConnectionCleanUpSchedule(
    getConfig().EXPIRED_CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES,
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
  const threshold = getConfig().CONNECTION_EXPIRATION_MINUTES * 60 * 1000;

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

const cleanUpConnection = async (expiredConnection: ConnectionCleanUpObj) => {
  const aggregatorAdapter =
    adapterMap[expiredConnection.aggregatorId].createWidgetAdapter();
  await aggregatorAdapter
    .DeleteConnection(expiredConnection.connectionId, expiredConnection.userId)
    .then(async () => {
      info(
        `Connection ${expiredConnection.connectionId} cleaned up successfully.`,
      );
      await del(connectionCleanUpRedisKey(expiredConnection.id));
    })
    .catch(async (deleteError) => {
      const currentRetryCount = (expiredConnection.retryCount || 0) + 1;

      if (currentRetryCount >= 3) {
        error(
          `Failed to clean up connection after 3 attempts. Removing from cleanup queue. Connection details: ${JSON.stringify(expiredConnection)}. Final error: ${deleteError.message}`,
        );
        await del(connectionCleanUpRedisKey(expiredConnection.id));
      } else {
        const updatedConnection = {
          ...expiredConnection,
          retryCount: currentRetryCount,
        };
        await set(
          connectionCleanUpRedisKey(expiredConnection.id),
          updatedConnection,
        );
        warning(
          `Failed to clean up connection ${expiredConnection.connectionId || expiredConnection.id} (attempt ${currentRetryCount}/3): ${deleteError.message}`,
        );
      }
    });
};
