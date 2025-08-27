import type { Request } from "express";

export const setAggregatorOnContext = ({
  aggregatorId,
  req,
}: {
  aggregatorId: string;
  req: Request;
}) => {
  req.context.aggregator = aggregatorId;
};

export const getAggregatorFromContext = (req: Request) => {
  return req.context.aggregator;
};

export const getJobTypesFromContext = (req: Request) => {
  return req.context.jobTypes;
};

export const getAggregatorOverrideFromContext = (req: Request) => {
  return req.context.aggregatorOverride;
};

export const setResolvedUserIdOnContext = ({
  resolvedUserId,
  req,
}: {
  resolvedUserId: string | null;
  req: Request;
}) => {
  req.context.resolvedUserId = resolvedUserId;
};

export const setPerformanceSessionIdOnContext = ({
  performanceSessionId,
  req,
}: {
  performanceSessionId: string;
  req: Request;
}) => {
  req.context.performanceSessionId = performanceSessionId;
};

export const getPerformanceSessionIdFromContext = (req: Request) => {
  return req.context.performanceSessionId;
};
