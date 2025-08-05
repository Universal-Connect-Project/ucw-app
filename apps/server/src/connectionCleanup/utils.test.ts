import { server } from "../test/testServer";
import { setConnectionForCleanup, initCleanUpConnections } from "./utils";
import { http, HttpResponse } from "msw";
import * as logger from "../infra/logger";
import { clearIntervalAsync } from "set-interval-async";
import { clearRedisMock } from "../__mocks__/redis";
import { get } from "../services/storageClient/redis";
import * as config from "../config";
import { DELETE_CONNECTION_PATH } from "@repo/utils-dev-dependency";
import { PLAID_BASE_PATH } from "@repo/plaid-adapter/src/apiClient";

describe("Connection Cleanup Utils", () => {
  const baseConnectionParams = {
    id: "test-connection-id",
    createdAt: Date.now(),
    aggregatorId: "mx",
    userId: "test-user-id",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    clearRedisMock();
  });

  describe("setConnectionForCleanup", () => {
    it("should store connection for cleanup in Redis", async () => {
      const debugSpy = jest.spyOn(logger, "debug").mockImplementation(() => {});

      await setConnectionForCleanup(baseConnectionParams);

      const storedConnection = await get(`cleanup:${baseConnectionParams.id}`);
      expect(storedConnection).toEqual(baseConnectionParams);
      expect(debugSpy).toHaveBeenCalledWith(
        `Connection ${baseConnectionParams.id} set for cleanup.`,
      );

      debugSpy.mockRestore();
    });

    it("should store multiple connections for cleanup", async () => {
      const connection1 = { ...baseConnectionParams, id: "conn-1" };
      const connection2 = {
        ...baseConnectionParams,
        id: "conn-2",
        aggregatorId: "plaid_sandbox",
      };

      await setConnectionForCleanup(connection1);
      await setConnectionForCleanup(connection2);

      const stored1 = await get(`cleanup:${connection1.id}`);
      const stored2 = await get(`cleanup:${connection2.id}`);

      expect(stored1).toEqual(connection1);
      expect(stored2).toEqual(connection2);
    });
  });

  describe("initCleanUpConnections", () => {
    it("should throw error when cleanup is disabled", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        CONNECTION_CLEANUP_INTERVAL_MINUTES: undefined,
        CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });

      const { initCleanUpConnections } = await import("./utils");

      await expect(initCleanUpConnections()).rejects.toThrow(
        "Connection cleanup is disabled in the configuration.",
      );
    });

    it("should start cleanup schedule and log info message", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        CONNECTION_CLEANUP_INTERVAL_MINUTES: 30,
        CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });

      const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});
      const { initCleanUpConnections } = await import("./utils");

      const poller = await initCleanUpConnections();

      expect(infoSpy).toHaveBeenCalledWith(
        "Aggregator connections will be automatically deleted after 30 minutes to prevent ongoing aggregation and unnecessary billing.",
      );

      await clearIntervalAsync(poller);
      infoSpy.mockRestore();
    });
  });

  describe("cleanup process", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let poller: any;

    beforeEach(() => {
      jest.restoreAllMocks();
      jest.spyOn(config, "getConfig").mockReturnValue({
        CONNECTION_CLEANUP_INTERVAL_MINUTES: 30,
        CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1 / 60, // 1 second
      });
      jest.useFakeTimers();
    });

    afterEach(async () => {
      if (poller) {
        await clearIntervalAsync(poller);
      }
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("should not clean up connections that are not expired", async () => {
      const recentConnection = {
        ...baseConnectionParams,
        createdAt: Date.now(), // Created now, not expired
      };

      await setConnectionForCleanup(recentConnection);
      const debugSpy = jest.spyOn(logger, "debug");
      poller = await initCleanUpConnections();

      jest.advanceTimersByTime(60 * 1000);

      await clearIntervalAsync(poller);

      expect(debugSpy).toHaveBeenCalledWith(
        "No expired connections found for cleanup.",
      );

      debugSpy.mockRestore();
    });

    it("should clean up expired connections", async () => {
      const infoSpy = jest.spyOn(logger, "info");
      const debugSpy = jest.spyOn(logger, "debug");
      let deletedConnectionId;

      server.use(
        http.delete(DELETE_CONNECTION_PATH, ({ params }) => {
          deletedConnectionId = params.id;
          return new HttpResponse(null, { status: 200 });
        }),
      );

      const expiredConnection = {
        ...baseConnectionParams,
        createdAt: Date.now() - 31 * 60 * 1000, // 31 minutes ago (expired)
      };

      await setConnectionForCleanup(expiredConnection);
      poller = await initCleanUpConnections();

      jest.advanceTimersByTime(60 * 1000);

      await clearIntervalAsync(poller);

      expect(deletedConnectionId).toBe(expiredConnection.id);
      expect(debugSpy).toHaveBeenCalledWith(
        "Found 1 expired connections for cleanup.",
      );
      expect(infoSpy).toHaveBeenCalledWith(
        `Connection ${expiredConnection.id} cleaned up successfully.`,
      );

      // Connection should be removed from Redis
      const remainingConnection = await get(`cleanup:${expiredConnection.id}`);
      expect(remainingConnection).toBeUndefined();

      infoSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it("should handle cleanup failures gracefully", async () => {
      const warningSpy = jest
        .spyOn(logger, "warning")
        .mockImplementation(() => {});

      server.use(
        http.delete(
          DELETE_CONNECTION_PATH,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      const expiredConnection = {
        ...baseConnectionParams,
        createdAt: Date.now() - 31 * 60 * 1000,
      };

      await setConnectionForCleanup(expiredConnection);
      poller = await initCleanUpConnections();

      jest.advanceTimersByTime(60 * 1000);
      await clearIntervalAsync(poller);

      expect(warningSpy).toHaveBeenCalledWith(
        `Failed to clean up connection ${expiredConnection.id}: Request failed with status code 400`,
      );

      // Connection should still exist in Redis since cleanup failed
      const remainingConnection = await get(`cleanup:${expiredConnection.id}`);
      expect(remainingConnection).toEqual(expiredConnection);

      warningSpy.mockRestore();
    });

    it("should clean up multiple expired connections", async () => {
      const deletedConnectionIds: unknown[] = [];

      server.use(
        http.delete(DELETE_CONNECTION_PATH, ({ params }) => {
          deletedConnectionIds.push(params.id);
          return new HttpResponse(null, { status: 200 });
        }),
        http.post(`${PLAID_BASE_PATH}/item/remove`, async ({ request }) => {
          const body = (await request.json()) as { access_token: string };
          deletedConnectionIds.push(body.access_token);
          return new HttpResponse(null, { status: 200 });
        }),
      );

      const connection1 = {
        ...baseConnectionParams,
        id: "expired-conn-1",
        createdAt: Date.now() - 31 * 60 * 1000,
      };
      const connection2 = {
        ...baseConnectionParams,
        id: "expired-conn-2",
        aggregatorId: "plaid_sandbox",
        createdAt: Date.now() - 35 * 60 * 1000,
      };

      await setConnectionForCleanup(connection1);
      await setConnectionForCleanup(connection2);
      poller = await initCleanUpConnections();

      jest.advanceTimersByTime(60 * 1000);
      await clearIntervalAsync(poller);

      expect(deletedConnectionIds).toEqual(
        expect.arrayContaining([connection1.id, connection2.id]),
      );
    });

    it("should handle mixed expired and non-expired connections", async () => {
      const deletedConnectionIds: unknown[] = [];
      const expiredConnection = {
        ...baseConnectionParams,
        id: "expired-conn",
        createdAt: Date.now() - 31 * 60 * 1000,
      };
      const recentConnection = {
        ...baseConnectionParams,
        id: "recent-conn",
        createdAt: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };

      server.use(
        http.delete(DELETE_CONNECTION_PATH, ({ params }) => {
          deletedConnectionIds.push(params.id);
          return new HttpResponse(null, { status: 200 });
        }),
      );

      await setConnectionForCleanup(expiredConnection);
      await setConnectionForCleanup(recentConnection);
      poller = await initCleanUpConnections();

      jest.advanceTimersByTime(60 * 1000);
      await clearIntervalAsync(poller);

      expect(deletedConnectionIds.length).toBe(1);
      expect(deletedConnectionIds[0]).toBe(expiredConnection.id);

      // Recent connection should still exist
      const remainingConnection = await get(`cleanup:${recentConnection.id}`);
      expect(remainingConnection).toEqual(recentConnection);
    });

    it("should do nothing when no connections exist", async () => {
      const debugSpy = jest.spyOn(logger, "debug").mockImplementation(() => {});

      poller = await initCleanUpConnections();

      jest.advanceTimersByTime(60 * 1000);
      await clearIntervalAsync(poller);

      expect(debugSpy).toHaveBeenCalledWith("No connections to clean up.");

      debugSpy.mockRestore();
    });
  });
});
