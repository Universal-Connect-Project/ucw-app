import { initializePerformanceAndCleanup } from "./appInitializer";
import * as performanceSyncer from "./performanceSyncer";
import * as cleanupUtils from "../connectionCleanup/utils";
import * as perfUtils from "../aggregatorPerformanceMeasuring/utils";

describe("initializePerformanceAndCleanup", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("when both cleanup and performance are enabled", () => {
    it("should initialize cleanup, sync performance data, and start resilience poller", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(true);
      jest
        .spyOn(performanceSyncer, "getPerformanceEnabled")
        .mockReturnValue(true);
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

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.getPerformanceEnabled).toHaveBeenCalledTimes(1);
      expect(initCleanupSpy).toHaveBeenCalledTimes(1);
      expect(syncDataSpy).toHaveBeenCalledTimes(1);
      expect(setPollerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is enabled but performance is disabled", () => {
    it("should initialize cleanup and start resilience poller but not sync performance data", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(true);
      jest
        .spyOn(performanceSyncer, "getPerformanceEnabled")
        .mockReturnValue(false);
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

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.getPerformanceEnabled).toHaveBeenCalledTimes(1);
      expect(initCleanupSpy).toHaveBeenCalledTimes(1);
      expect(syncDataSpy).not.toHaveBeenCalled();
      expect(setPollerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is disabled but performance is enabled", () => {
    it("should sync performance data and start resilience poller", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(false);
      jest
        .spyOn(performanceSyncer, "getPerformanceEnabled")
        .mockReturnValue(true);
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

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.getPerformanceEnabled).toHaveBeenCalledTimes(1);
      expect(initCleanupSpy).not.toHaveBeenCalled();
      expect(syncDataSpy).toHaveBeenCalledTimes(1);
      expect(setPollerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when both cleanup and performance are disabled", () => {
    it("should not call any initialization functions", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(false);
      jest
        .spyOn(performanceSyncer, "getPerformanceEnabled")
        .mockReturnValue(false);
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

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.getPerformanceEnabled).toHaveBeenCalledTimes(1);
      expect(initCleanupSpy).not.toHaveBeenCalled();
      expect(syncDataSpy).not.toHaveBeenCalled();
      expect(setPollerSpy).not.toHaveBeenCalled();
    });
  });
});
