import { initializePerformanceAndCleanup } from "./appInitializer";
import * as performanceSyncer from "./performanceSyncer";
import * as cleanupUtils from "../connectionCleanup/utils";
import * as perfUtils from "../aggregatorPerformanceMeasuring/utils";

describe("initializePerformanceAndCleanup", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("when cleanup is enabled and performance sync succeeds", () => {
    it("should initialize cleanup and start resilience poller", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(true);
      jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockResolvedValue(undefined);
      jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockResolvedValue(undefined);
      jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockResolvedValue(undefined);

      await initializePerformanceAndCleanup();

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.syncPerformanceData).toHaveBeenCalledTimes(1);
      expect(cleanupUtils.initCleanUpConnections).toHaveBeenCalledTimes(1);
      expect(perfUtils.setPerformanceResiliencePoller).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is disabled and performance sync succeeds", () => {
    it("should not initialize cleanup but start resilience poller", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(false);
      jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockResolvedValue(undefined);
      jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockResolvedValue(undefined);
      jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockResolvedValue(undefined);

      await initializePerformanceAndCleanup();

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.syncPerformanceData).toHaveBeenCalledTimes(1);
      expect(cleanupUtils.initCleanUpConnections).not.toHaveBeenCalled();
      expect(perfUtils.setPerformanceResiliencePoller).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is enabled and performance sync fails", () => {
    it("should initialize cleanup and start resilience poller", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(true);
      jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockRejectedValue(new Error("Performance sync failed"));
      jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockResolvedValue(undefined);
      jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockResolvedValue(undefined);

      await initializePerformanceAndCleanup();

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.syncPerformanceData).toHaveBeenCalledTimes(1);
      expect(cleanupUtils.initCleanUpConnections).toHaveBeenCalledTimes(1);
      expect(perfUtils.setPerformanceResiliencePoller).toHaveBeenCalledTimes(1);
    });
  });

  describe("when cleanup is disabled and performance sync fails", () => {
    it("should not initialize cleanup or resilience poller", async () => {
      jest
        .spyOn(cleanupUtils, "getConnectionCleanUpFeatureEnabled")
        .mockReturnValue(false);
      jest
        .spyOn(performanceSyncer, "syncPerformanceData")
        .mockRejectedValue(new Error("sync failed"));
      jest
        .spyOn(cleanupUtils, "initCleanUpConnections")
        .mockResolvedValue(undefined);
      jest
        .spyOn(perfUtils, "setPerformanceResiliencePoller")
        .mockResolvedValue(undefined);

      await initializePerformanceAndCleanup();

      expect(
        cleanupUtils.getConnectionCleanUpFeatureEnabled,
      ).toHaveBeenCalledTimes(1);
      expect(performanceSyncer.syncPerformanceData).toHaveBeenCalledTimes(1);
      expect(cleanupUtils.initCleanUpConnections).not.toHaveBeenCalled();
      expect(perfUtils.setPerformanceResiliencePoller).not.toHaveBeenCalled();
    });
  });
});
