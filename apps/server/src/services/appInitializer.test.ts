import { initializePerformanceAndCleanup } from "./appInitializer";
import * as performanceSyncer from "./performanceSyncer";
import * as cleanupUtils from "../connectionCleanup/utils";
import * as perfUtils from "../aggregatorPerformanceMeasuring/utils";
import * as config from "../config";

describe("initializePerformanceAndCleanup", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("when both cleanup and performance are enabled", () => {
    it("should initialize cleanup, sync performance data, and start resilience poller", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        UCP_CLIENT_ID: "test-client-id",
        UCP_CLIENT_SECRET: "test-client-secret",
        CONNECTION_EXPIRATION_MINUTES: 30,
        EXPIRED_CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });
      const initCleanupSpy = jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockImplementation();
      const syncDataSpy = jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockImplementation();
      const setPollerSpy = jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockImplementation();

      await initializePerformanceAndCleanup();

      expect(initCleanupSpy).toHaveBeenCalledTimes(1);
      expect(syncDataSpy).toHaveBeenCalledTimes(1);
      expect(setPollerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is enabled but performance is disabled", () => {
    it("should initialize cleanup and start resilience poller but not sync performance data", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        CONNECTION_EXPIRATION_MINUTES: 30,
        EXPIRED_CONNECTION_CLEANUP_POLLING_INTERVAL_MINUTES: 1,
      });
      const initCleanupSpy = jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockImplementation();
      const syncDataSpy = jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockImplementation();
      const setPollerSpy = jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockImplementation();

      await initializePerformanceAndCleanup();

      expect(initCleanupSpy).toHaveBeenCalledTimes(1);
      expect(syncDataSpy).not.toHaveBeenCalled();
      expect(setPollerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is disabled but performance is enabled", () => {
    it("should sync performance data and start resilience poller", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        UCP_CLIENT_ID: "test-client-id",
        UCP_CLIENT_SECRET: "test-client-secret",
      });
      const initCleanupSpy = jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockImplementation();
      const syncDataSpy = jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockImplementation();
      const setPollerSpy = jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockImplementation();

      await initializePerformanceAndCleanup();

      expect(initCleanupSpy).not.toHaveBeenCalled();
      expect(syncDataSpy).toHaveBeenCalledTimes(1);
      expect(setPollerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when both cleanup and performance are disabled", () => {
    it("should not call any initialization functions", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({});
      const initCleanupSpy = jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockImplementation();
      const syncDataSpy = jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockImplementation();
      const setPollerSpy = jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockImplementation();

      await initializePerformanceAndCleanup();

      expect(initCleanupSpy).not.toHaveBeenCalled();
      expect(syncDataSpy).not.toHaveBeenCalled();
      expect(setPollerSpy).not.toHaveBeenCalled();
    });
  });
});
