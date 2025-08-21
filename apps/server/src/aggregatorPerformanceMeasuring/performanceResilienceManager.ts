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

class EventDrivenPerformanceResilienceManager {
  private performanceResilienceEnabled: boolean = false;
  private activeSessionsCache = new Set<string>();
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  async init() {
    try {
      await this.initializeExistingSessions();
      this.performanceResilienceEnabled = true;

      info("Event-driven performance resilience enabled");
    } catch (err) {
      error("Failed to initialize event-driven performance manager:", err);
      throw err;
    }
  }

  private async initializeExistingSessions() {
    try {
      const performanceKeys = await redisClient.keys(
        `${PERFORMANCE_REDIS_SUBDIRECTORY}:*`,
      );

      if (performanceKeys.length > 0) {
        const existingSessions = performanceKeys
          .map((key) => key.split(":")[1])
          .filter((sessionId) => sessionId);

        existingSessions.forEach((sessionId) => {
          this.activeSessionsCache.add(sessionId);
        });

        if (this.activeSessionsCache.size > 0) {
          info(
            `Found ${this.activeSessionsCache.size} existing performance sessions, starting processor`,
          );
          this.ensureProcessorRunning();
        }
      } else {
        debug("No existing performance sessions found in Redis");
      }
    } catch (err) {
      error("Error initializing existing performance sessions:", err);
    }
  }

  async addSession(sessionId: string): Promise<void> {
    if (!this.performanceResilienceEnabled) return;

    this.activeSessionsCache.add(sessionId);
    this.ensureProcessorRunning();
    info(
      `Added session ${sessionId} to active cache. Total: ${this.activeSessionsCache.size}`,
    );
  }

  async removeSession(sessionId: string): Promise<void> {
    if (!this.performanceResilienceEnabled) return;

    this.activeSessionsCache.delete(sessionId);
    if (this.activeSessionsCache.size === 0) {
      this.stopProcessor();
    }
    info(`Removed session ${sessionId} from cache`);
  }

  private ensureProcessorRunning() {
    if (!this.processingInterval && this.activeSessionsCache.size > 0) {
      this.processingInterval = setInterval(async () => {
        await this.processActiveSessions();
      }, this.POLL_INTERVAL);

      info(
        `Started session processor - ${this.activeSessionsCache.size} active sessions detected`,
      );
    }
  }

  private stopProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      info("Stopped session processor - no active sessions");
    }
  }

  private async processActiveSessions() {
    if (this.activeSessionsCache.size === 0) {
      this.stopProcessor();
      return;
    }

    debug(`Processing ${this.activeSessionsCache.size} active sessions`);

    const sessionsToRemove: string[] = [];

    for (const sessionId of this.activeSessionsCache) {
      try {
        await pollConnectionStatusIfNeeded(sessionId);
      } catch (err) {
        error(`Error processing session ${sessionId}:`, err);
        sessionsToRemove.push(sessionId);
      }
    }

    sessionsToRemove.forEach((sessionId) => {
      this.activeSessionsCache.delete(sessionId);
      info(`Removed failed session ${sessionId} from cache`);
    });

    // Stop processor if no sessions remain
    if (this.activeSessionsCache.size === 0) {
      this.stopProcessor();
    }
  }

  async shutdown() {
    this.stopProcessor();
    this.activeSessionsCache.clear();
  }

  // For testing or logs
  getStats() {
    return {
      activeSessions: this.activeSessionsCache.size,
      processorRunning: !!this.processingInterval,
      sessionIds: Array.from(this.activeSessionsCache),
    };
  }
}

// Singleton instance
export const performanceResilienceManager =
  new EventDrivenPerformanceResilienceManager();

export async function startPerformanceResilience() {
  await performanceResilienceManager.init();
  return performanceResilienceManager;
}
