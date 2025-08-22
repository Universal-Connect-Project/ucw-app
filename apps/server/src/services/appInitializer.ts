import {
  getPerformanceEnabled,
  syncPerformanceData,
} from "./performanceSyncer";
import {
  getConnectionCleanUpFeatureEnabled,
  initCleanUpConnections,
} from "../connectionCleanup/utils";
import { startPerformanceResilience } from "../aggregatorPerformanceMeasuring/performanceResilienceManager";

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
    await startPerformanceResilience();
  }
}
