import type { Request } from "express";
import { getAggregatorWidgetAdapter } from "../adapters/getAggregatorWidgetAdapter";

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
