import { setIntervalAsync } from "set-interval-async";
import { getConfig } from "../config";
import { info, warning, debug } from "../infra/logger";
import { adapterMap } from "../adapterSetup";
import { del, set, get, redisClient } from "../services/storageClient/redis";

interface ConnectionCleanUpObj {
  id: string;
  createdAt: number;
  aggregatorId: string;
  userId: string;
}

const CONNECTION_CLEANUP_REDIS_SUBDIRECTORY = "cleanup";

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
  if (!getConfig().CONNECTION_CLEANUP_INTERVAL_MINUTES) {
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
  await aggregatorAdapter
    .DeleteConnection(connection.id, connection.userId)
    .then(async () => {
      info(`Connection ${connection.id} cleaned up successfully.`);
      await del(connectionCleanUpRedisKey(connection.id));
    })
    .catch((error) => {
      warning(
        `Failed to clean up connection ${connection.id}: ${error.message}`,
      );
    });
};
