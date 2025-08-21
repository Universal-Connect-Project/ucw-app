import { redisClient } from "../services/storageClient/redis";
import { info, debug, error } from "../infra/logger";
import {
  PERFORMANCE_REDIS_SUBDIRECTORY,
  pollConnectionStatusIfNeeded,
} from "./utils";

export interface PerformanceEvent {
  type: "session_created" | "session_removed";
  sessionId: string;
}

const createEventDrivenPerformanceResilienceManager = () => {
  let performanceResilienceEnabled: boolean = false;
  const activeSessionsCache = new Set<string>();
  let processingInterval: NodeJS.Timeout | null = null;
  const POLL_INTERVAL = 5000;

  const init = async () => {
    performanceResilienceEnabled = true;
    await initializeExistingSessions();
    info("Performance Resilience enabled");
  };

  const initializeExistingSessions = async () => {
    try {
      const performanceKeys = await redisClient.keys(
        `${PERFORMANCE_REDIS_SUBDIRECTORY}:*`,
      );

      if (performanceKeys.length > 0) {
        const existingSessions = performanceKeys
          .map((key) => key.split(":")[1])
          .filter((sessionId) => sessionId);

        existingSessions.forEach((sessionId) => {
          activeSessionsCache.add(sessionId);
        });

        if (activeSessionsCache.size > 0) {
          info(
            `Found ${activeSessionsCache.size} existing performance sessions, starting processor`,
          );
          ensureProcessorRunning();
        }
      } else {
        debug("No existing performance sessions found in Redis");
      }
    } catch (err) {
      error("Error initializing existing performance sessions:", err);
    }
  };

  const ensureProcessorRunning = () => {
    if (!processingInterval && activeSessionsCache.size > 0) {
      processingInterval = setInterval(async () => {
        await processActiveSessions();
      }, POLL_INTERVAL);

      info(
        `Started session processor - ${activeSessionsCache.size} active sessions detected`,
      );
    }
  };

  const stopProcessor = () => {
    if (processingInterval) {
      clearInterval(processingInterval);
      processingInterval = null;
      info("Stopped session processor - no active sessions");
    }
  };

  const processActiveSessions = async () => {
    if (activeSessionsCache.size === 0) {
      stopProcessor();
      return;
    }

    debug(`Processing ${activeSessionsCache.size} active sessions`);

    const sessionsToRemove: string[] = [];

    await Promise.all(
      [...activeSessionsCache].map(async (sessionId) => {
        try {
          await pollConnectionStatusIfNeeded(sessionId);
        } catch (err) {
          error(`Error processing session ${sessionId}:`, err);
          sessionsToRemove.push(sessionId);
        }
      }),
    );

    sessionsToRemove.forEach((sessionId) => {
      activeSessionsCache.delete(sessionId);
      info(`Removed failed session ${sessionId} from cache`);
    });

    // Stop processor if no sessions remain
    if (activeSessionsCache.size === 0) {
      stopProcessor();
    }
  };

  const shutdown = () => {
    stopProcessor();
    activeSessionsCache.clear();
  };

  const getStats = () => {
    return {
      activeSessions: activeSessionsCache.size,
      processorRunning: !!processingInterval,
      sessionIds: Array.from(activeSessionsCache),
    };
  };

  const addSession = (sessionId: string) => {
    if (!performanceResilienceEnabled) return;

    activeSessionsCache.add(sessionId);
    ensureProcessorRunning();
    info(
      `Added session ${sessionId} to active cache. Total: ${activeSessionsCache.size}`,
    );
  };

  const removeSession = (sessionId: string) => {
    if (!performanceResilienceEnabled) return;

    activeSessionsCache.delete(sessionId);
    if (activeSessionsCache.size === 0) {
      stopProcessor();
    }
    info(`Removed session ${sessionId} from cache`);
  };

  return {
    shutdown,
    init,
    getStats,
    addSession,
    removeSession,
  };
};

export const performanceResilienceManager =
  createEventDrivenPerformanceResilienceManager();

export async function startPerformanceResilience() {
  await performanceResilienceManager.init();
  return performanceResilienceManager;
}
