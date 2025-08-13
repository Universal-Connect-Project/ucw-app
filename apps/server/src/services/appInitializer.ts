import { syncPerformanceData } from "./performanceSyncer";
import {
  getConnectionCleanUpFeatureEnabled,
  initCleanUpConnections,
} from "../connectionCleanup/utils";
import { setPerformanceResiliencePoller } from "../aggregatorPerformanceMeasuring/utils";

export async function initializePerformanceAndCleanup(): Promise<void> {
  const cleanupEnabled = getConnectionCleanUpFeatureEnabled();
  const performanceEnabled = await syncPerformanceData()
    .then(() => true)
    .catch(() => false);

  if (cleanupEnabled) {
    initCleanUpConnections();
  }

  if (performanceEnabled || cleanupEnabled) {
    setPerformanceResiliencePoller();
  }
}
