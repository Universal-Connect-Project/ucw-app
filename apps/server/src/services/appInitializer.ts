import { error as _error, info } from "../infra/logger";
import {
  setPerformanceSyncSchedule,
  syncPerformanceData,
} from "./performanceSyncer";
import { initCleanUpConnections } from '../connectionCleanup/utils';
import { setPerformanceResiliencePoller } from "../aggregatorPerformanceMeasuring/utils";

export interface InitializationResult {
  performanceSuccess: boolean;
  cleanupEnabled: boolean;
}

/**
 * Initializes performance sync and connection cleanup with proper dependency handling
 * - If performance sync succeeds: starts both sync schedule and resilience poller
 * - If performance sync fails: only starts resilience poller if cleanup is enabled
 * - Always reports cleanup status
 */
export async function initializePerformanceAndCleanup(): Promise<InitializationResult> {
  const [performanceResult, cleanupResult] = await Promise.allSettled([
    syncPerformanceData(),
    initCleanUpConnections()
  ]);

  const performanceSuccess = performanceResult.status === 'fulfilled';
  const cleanupEnabled = cleanupResult.status === 'fulfilled';
  
  if (performanceSuccess) {
    await Promise.allSettled([
      setPerformanceSyncSchedule().then(() => {
        info("Performance based routing data is scheduled to sync");
      }),
      setPerformanceResiliencePoller().then(() => {
        info("Performance resilience polling enabled");
      })
    ]);
  } else {
    _error("Unable to connect to UCP hosted servers. The UCP Client ID and/or Secret may be invalid. Please check them here: https://app.universalconnectproject.org/widget-management. Performance-based features are disabled until this is resolved.", performanceResult.reason);
    
    if (cleanupEnabled) {
      try {
        await setPerformanceResiliencePoller();
        info("Performance resilience polling enabled (cleanup mode)");
      } catch (pollerError) {
        _error("Failed to start performance resilience poller", pollerError);
      }
    }
  }
  
  if (cleanupEnabled) {
    info("Connection cleanup enabled");
  } else {
    info("Connection cleanup disabled");
  }

  return {
    performanceSuccess,
    cleanupEnabled
  };
}
