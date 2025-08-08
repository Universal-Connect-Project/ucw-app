import {
  initializePerformanceAndCleanup,
  type InitializationResult,
} from "./appInitializer";
import * as logger from "../infra/logger";
import * as performanceSyncer from "./performanceSyncer";
import * as cleanupUtils from "../connectionCleanup/utils";
import * as perfUtils from "../aggregatorPerformanceMeasuring/utils";

jest.mock("../infra/logger");
jest.mock("./performanceSyncer");
jest.mock("../connectionCleanup/utils");
jest.mock("../aggregatorPerformanceMeasuring/utils");

describe("initializePerformanceAndCleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when both performance sync and cleanup succeed", () => {
    it("should start both sync schedule and resilience poller", async () => {
      (performanceSyncer.syncPerformanceData as jest.Mock).mockResolvedValue(
        undefined,
      );
      (cleanupUtils.initCleanUpConnections as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        performanceSyncer.setPerformanceSyncSchedule as jest.Mock
      ).mockResolvedValue(undefined);
      (perfUtils.setPerformanceResiliencePoller as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result: InitializationResult =
        await initializePerformanceAndCleanup();

      expect(performanceSyncer.syncPerformanceData).toHaveBeenCalledTimes(1);
      expect(cleanupUtils.initCleanUpConnections).toHaveBeenCalledTimes(1);
      expect(
        performanceSyncer.setPerformanceSyncSchedule,
      ).toHaveBeenCalledTimes(1);
      expect(perfUtils.setPerformanceResiliencePoller).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        "Performance based routing data is scheduled to sync",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Performance resilience polling enabled",
      );
      expect(logger.info).toHaveBeenCalledWith("Connection cleanup enabled");
      expect(result).toEqual({
        performanceSuccess: true,
        cleanupEnabled: true,
      });
    });
  });

  describe("when performance sync fails but cleanup succeeds", () => {
    it("should start resilience poller in cleanup mode", async () => {
      const performanceError = new Error("Performance sync failed");
      (performanceSyncer.syncPerformanceData as jest.Mock).mockRejectedValue(
        performanceError,
      );
      (cleanupUtils.initCleanUpConnections as jest.Mock).mockResolvedValue(
        undefined,
      );
      (perfUtils.setPerformanceResiliencePoller as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result: InitializationResult =
        await initializePerformanceAndCleanup();

      expect(
        performanceSyncer.setPerformanceSyncSchedule,
      ).not.toHaveBeenCalled();
      expect(perfUtils.setPerformanceResiliencePoller).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        "Unable to connect to UCP hosted servers. The UCP Client ID and/or Secret may be invalid. Please check them here: https://app.universalconnectproject.org/widget-management. Performance-based features are disabled until this is resolved.",
        performanceError,
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Performance resilience polling enabled (cleanup mode)",
      );
      expect(logger.info).toHaveBeenCalledWith("Connection cleanup enabled");
      expect(result).toEqual({
        performanceSuccess: false,
        cleanupEnabled: true,
      });
    });

    it("should handle resilience poller failure gracefully", async () => {
      const performanceError = new Error("Performance sync failed");
      const pollerError = new Error("Poller failed");
      (performanceSyncer.syncPerformanceData as jest.Mock).mockRejectedValue(
        performanceError,
      );
      (cleanupUtils.initCleanUpConnections as jest.Mock).mockResolvedValue(
        undefined,
      );
      (perfUtils.setPerformanceResiliencePoller as jest.Mock).mockRejectedValue(
        pollerError,
      );

      const result: InitializationResult =
        await initializePerformanceAndCleanup();

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to start performance resilience poller",
        pollerError,
      );
      expect(result).toEqual({
        performanceSuccess: false,
        cleanupEnabled: true,
      });
    });
  });

  describe("when performance sync fails and cleanup fails", () => {
    it("should not start resilience poller", async () => {
      const performanceError = new Error("Performance sync failed");
      const cleanupError = new Error("Cleanup failed");
      (performanceSyncer.syncPerformanceData as jest.Mock).mockRejectedValue(
        performanceError,
      );
      (cleanupUtils.initCleanUpConnections as jest.Mock).mockRejectedValue(
        cleanupError,
      );

      const result: InitializationResult =
        await initializePerformanceAndCleanup();

      expect(
        performanceSyncer.setPerformanceSyncSchedule,
      ).not.toHaveBeenCalled();
      expect(perfUtils.setPerformanceResiliencePoller).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        "Unable to connect to UCP hosted servers. The UCP Client ID and/or Secret may be invalid. Please check them here: https://app.universalconnectproject.org/widget-management. Performance-based features are disabled until this is resolved.",
        performanceError,
      );
      expect(logger.info).toHaveBeenCalledWith("Connection cleanup disabled");
      expect(result).toEqual({
        performanceSuccess: false,
        cleanupEnabled: false,
      });
    });
  });

  describe("when performance sync succeeds but cleanup fails", () => {
    it("should start sync schedule and resilience poller normally", async () => {
      const cleanupError = new Error("Cleanup failed");
      (performanceSyncer.syncPerformanceData as jest.Mock).mockResolvedValue(
        undefined,
      );
      (cleanupUtils.initCleanUpConnections as jest.Mock).mockRejectedValue(
        cleanupError,
      );
      (
        performanceSyncer.setPerformanceSyncSchedule as jest.Mock
      ).mockResolvedValue(undefined);
      (perfUtils.setPerformanceResiliencePoller as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result: InitializationResult =
        await initializePerformanceAndCleanup();

      expect(
        performanceSyncer.setPerformanceSyncSchedule,
      ).toHaveBeenCalledTimes(1);
      expect(perfUtils.setPerformanceResiliencePoller).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        "Performance based routing data is scheduled to sync",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Performance resilience polling enabled",
      );
      expect(logger.info).toHaveBeenCalledWith("Connection cleanup disabled");
      expect(result).toEqual({
        performanceSuccess: true,
        cleanupEnabled: false,
      });
    });
  });
});
