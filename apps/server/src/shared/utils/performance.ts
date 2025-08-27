import type { Request } from "express";
import { getAggregatorWidgetAdapter } from "../../adapters/getAggregatorWidgetAdapter";
import { createPerformancePollingObject } from "../../aggregatorPerformanceMeasuring/utils";

export const getShouldRecordPerformance = (req: Request) => {
  const isRefreshConnection =
    req.context.aggregator && req.context.connectionId;

  const aggregatorAdapter = getAggregatorWidgetAdapter(req);

  const isPerformanceEnabled = aggregatorAdapter.performanceEnabled ?? true;

  return !!(!isRefreshConnection && isPerformanceEnabled);
};

export const getShouldRecordPerformanceDuration = (req: Request) => {
  const aggregatorAdapter = getAggregatorWidgetAdapter(req);

  return aggregatorAdapter.shouldRecordPerformanceDuration ?? true;
};

export const getRequiresPollingForPerformance = (req: Request) => {
  const aggregatorAdapter = getAggregatorWidgetAdapter(req);

  return aggregatorAdapter.requiresPollingForPerformance ?? true;
};

export const initializePerformancePolling = (req: Request) => {
  if (
    getShouldRecordPerformance(req) &&
    getRequiresPollingForPerformance(req)
  ) {
    createPerformancePollingObject({
      userId: req.context.userId,
      connectionId: req.context.connectionId,
      performanceSessionId: req.context.performanceSessionId,
      aggregatorId: req.context.aggregator,
      jobId: req.context.current_job_id,
    });
  }
};
