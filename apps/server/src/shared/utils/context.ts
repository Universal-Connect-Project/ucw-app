import type { Request } from "express";
import type { Context } from "../contract";

const createContextGetter = <K extends keyof Context>(prop: K) => {
  return (req: Request): Context[K] => {
    return req.context[prop];
  };
};

export const getAggregatorFromContext = createContextGetter("aggregator");

export const getJobTypesFromContext = createContextGetter("jobTypes");

export const getAggregatorOverrideFromContext =
  createContextGetter("aggregatorOverride");

export const getResolvedUserIdFromContext =
  createContextGetter("resolvedUserId");

export const getPerformanceSessionIdFromContext = createContextGetter(
  "performanceSessionId",
);

export const getCurrentJobIdFromContext = createContextGetter("current_job_id");

export const setAggregatorOnContext = ({
  aggregatorId,
  req,
}: {
  aggregatorId: string;
  req: Request;
}) => {
  req.context.aggregator = aggregatorId;
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

export const setCurrentJobIdOnContext = ({
  currentJobId,
  req,
}: {
  currentJobId: string | null;
  req: Request;
}) => {
  req.context.current_job_id = currentJobId;
};
