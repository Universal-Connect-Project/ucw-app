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
import { memberStatusData } from "@repo/utils-dev-dependency/mx/testData";
import { getConfig } from "../config";
import { http, HttpResponse } from "msw";
import { server } from "../test/testServer";
import { READ_MEMBER_STATUS_PATH } from "@repo/utils-dev-dependency";

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

  it("should poll status and record success to the performance service, then stop polling", async () => {
    jest.useFakeTimers();

    interface PolledConnectionParams {
      id: string;
      userId: string;
    }

    const statusPolledList: PolledConnectionParams[] = [];
    const performanceRecordedList: string[] = [];
    server.use(
      http.get(READ_MEMBER_STATUS_PATH, ({ params }) => {
        statusPolledList.push(params as unknown as PolledConnectionParams);
        return HttpResponse.json(memberStatusData);
      }),
      http.put(
        `${getConfig().PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
        ({ params }) => {
          performanceRecordedList.push(
            params.connectionId as unknown as string,
          );
          return new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        },
      ),
    );

    await startPerformanceResilience();

    const perfObj1 = {
      userId: "test-user-id-1",
      connectionId: "test-connection-id-1",
      performanceSessionId: "test-session-id-1",
      aggregatorId: "mx",
    };
    const perfObj2 = {
      userId: "test-user-id-2",
      connectionId: "test-connection-id-2",
      performanceSessionId: "test-session-id-2",
      aggregatorId: "mx",
    };

    await createPerformancePollingObject(perfObj1);
    await createPerformancePollingObject(perfObj2);

    jest.advanceTimersByTime(10000);

    await jest.runAllTimersAsync();

    expect(statusPolledList.length).toBeGreaterThanOrEqual(2);
    expect(statusPolledList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: perfObj1.connectionId,
          userId: perfObj1.userId,
        }),
        expect.objectContaining({
          id: perfObj2.connectionId,
          userId: perfObj2.userId,
        }),
      ]),
    );
    expect(performanceRecordedList).toEqual(
      expect.arrayContaining([
        perfObj1.performanceSessionId,
        perfObj2.performanceSessionId,
      ]),
    );

    expect(performanceResilienceManager.getStats()).toEqual(
      expect.objectContaining({
        activeSessions: 0,
        sessionIds: [],
        processorRunning: false,
      }),
    );

    jest.useRealTimers();
  });

  it("should remove session from active cache when 404 is received from read member status", async () => {
    jest.useFakeTimers();

    interface PolledConnectionParams {
      id: string;
      userId: string;
    }

    const statusPolledList: PolledConnectionParams[] = [];
    server.use(
      http.get(READ_MEMBER_STATUS_PATH, ({ params }) => {
        statusPolledList.push(params as unknown as PolledConnectionParams);
        return new HttpResponse(null, {
          status: 404,
          statusText: "Not Found",
        });
      }),
    );

    await startPerformanceResilience();

    const perfObj = {
      userId: "test-user-id-404",
      connectionId: "test-connection-id-404",
      performanceSessionId: "test-session-id-404",
      aggregatorId: "mx",
    };

    await createPerformancePollingObject(perfObj);

    expect(performanceResilienceManager.getStats().activeSessions).toBe(1);
    expect(performanceResilienceManager.getStats().sessionIds).toContain(
      perfObj.performanceSessionId,
    );

    jest.advanceTimersByTime(10000);
    await jest.runAllTimersAsync();

    expect(statusPolledList.length).toBeGreaterThanOrEqual(1);
    expect(statusPolledList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: perfObj.connectionId,
          userId: perfObj.userId,
        }),
      ]),
    );

    const stats = performanceResilienceManager.getStats();
    expect(stats.activeSessions).toBe(0);
    expect(stats.sessionIds).not.toContain(perfObj.performanceSessionId);
    expect(stats.processorRunning).toBe(false);

    jest.useRealTimers();
  });
});
