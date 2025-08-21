import {
  performanceResilienceManager,
  startPerformanceResilience,
} from "./performanceResilienceManager";
import {
  createPerformancePollingObject,
  cleanupPerformanceObject,
  pollConnectionStatusIfNeeded,
} from "./utils";
import { set } from "../services/storageClient/redis";

describe("Performance Resilience Manager", () => {
  const basePerformanceObject = {
    userId: "test-user-id",
    connectionId: "test-connection-id",
    performanceSessionId: "test-session-id",
    aggregatorId: "mx",
  };

  afterEach(async () => {
    await performanceResilienceManager.shutdown();
  });

  describe("Session Management", () => {
    it("should add session and start processor when creating performance object", async () => {
      await startPerformanceResilience();
      await createPerformancePollingObject(basePerformanceObject);

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(1);
      expect(stats.sessionIds).toContain(
        basePerformanceObject.performanceSessionId,
      );
      expect(stats.processorRunning).toBe(true);
    });

    it("should remove session when cleaning up performance object", async () => {
      await startPerformanceResilience();
      await createPerformancePollingObject(basePerformanceObject);

      expect(performanceResilienceManager.getStats().activeSessions).toBe(1);

      await cleanupPerformanceObject(
        basePerformanceObject.performanceSessionId,
      );

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.processorRunning).toBe(false);
    });
  });

  describe("Processor Management", () => {
    it("should track multiple active sessions and start processor", async () => {
      await startPerformanceResilience();

      await createPerformancePollingObject({
        ...basePerformanceObject,
        performanceSessionId: "test-session-1",
      });

      await createPerformancePollingObject({
        ...basePerformanceObject,
        performanceSessionId: "test-session-2",
      });

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(2);
      expect(stats.sessionIds).toContain("test-session-1");
      expect(stats.sessionIds).toContain("test-session-2");
      expect(stats.processorRunning).toBe(true);
    });

    it("should stop processor when no sessions remain", async () => {
      await startPerformanceResilience();

      await createPerformancePollingObject({
        ...basePerformanceObject,
        performanceSessionId: "test-session-1",
      });

      expect(performanceResilienceManager.getStats().activeSessions).toBe(1);

      await cleanupPerformanceObject("test-session-1");

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.processorRunning).toBe(false);
    });
  });

  describe("Initialization", () => {
    it("should initialize without error when no existing sessions", async () => {
      await startPerformanceResilience();

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.processorRunning).toBe(false);
    });

    it("should initialize and populate cache with existing sessions", async () => {
      await set("performance:session-1", { test: "test" });
      await set("performance:session-2", { test: "test" });
      await set("performance:session-3", { test: "test" });

      await startPerformanceResilience();

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(3);
      expect(stats.sessionIds).toEqual(["session-1", "session-2", "session-3"]);
      expect(stats.processorRunning).toBe(true);
    });
  });

  describe("Stats and Monitoring", () => {
    it("should provide accurate stats", async () => {
      await startPerformanceResilience();

      const initialStats = performanceResilienceManager.getStats();
      expect(initialStats.activeSessions).toBe(0);
      expect(initialStats.processorRunning).toBe(false);
      expect(initialStats.sessionIds).toEqual([]);
    });
  });

  describe("TTL Expiration Handling", () => {
    it("should remove session from manager when performance object expires due to TTL", async () => {
      await startPerformanceResilience();

      // Manually add session to manager to simulate it was there before TTL expiration
      await performanceResilienceManager.addSession("expired-session-id");
      expect(performanceResilienceManager.getStats().activeSessions).toBe(1);

      // Simulate TTL expiration by calling pollConnectionStatusIfNeeded with no Redis object created
      await pollConnectionStatusIfNeeded("expired-session-id");

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.sessionIds).not.toContain("expired-session-id");
    });
  });

  describe("Shutdown", () => {
    it("should shutdown gracefully", async () => {
      await startPerformanceResilience();

      await createPerformancePollingObject({
        ...basePerformanceObject,
        performanceSessionId: "test-session-1",
      });

      expect(performanceResilienceManager.getStats().activeSessions).toBe(1);

      await performanceResilienceManager.shutdown();

      const stats = performanceResilienceManager.getStats();
      expect(stats.activeSessions).toBe(0);
      expect(stats.processorRunning).toBe(false);
    });
  });
});
