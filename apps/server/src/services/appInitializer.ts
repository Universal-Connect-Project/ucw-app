import {
  getPerformanceEnabled,
  syncPerformanceData,
} from "./performanceSyncer";
import {
  getConnectionCleanUpFeatureEnabled,
  initCleanUpConnections,
} from "../connectionCleanup/utils";
import { setPerformanceResiliencePoller } from "../aggregatorPerformanceMeasuring/utils";

export async function initializePerformanceAndCleanup(): Promise<void> {
  const cleanupEnabled = getConnectionCleanUpFeatureEnabled();
  const performanceEnabled = getPerformanceEnabled();

  if (cleanupEnabled) {
    initCleanUpConnections();
  }

  if (performanceEnabled) {
    syncPerformanceData();
  }

  if (performanceEnabled || cleanupEnabled) {
    setPerformanceResiliencePoller();
  }
}
