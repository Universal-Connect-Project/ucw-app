import type { Request, Response } from "express";
import {
  getRequiresPollingForPerformance,
  getShouldRecordPerformance,
} from "../shared/utils/performance";
import { recordConnectionPauseEvent } from "../services/performanceTracking";
import {
  getAggregatorFromContext,
  getCurrentJobIdFromContext,
  getPerformanceSessionIdFromContext,
  getResolvedUserIdFromContext,
} from "../shared/utils/context";
import { createPerformancePollingObject } from "./utils";

export interface StartOauthPerformanceRequest extends Request {
  body: {
    connectionId: string;
  };
}

export const startOauthPerformance = async (
  req: StartOauthPerformanceRequest,
  res: Response,
) => {
  const {
    body: { connectionId },
  } = req;

  if (getShouldRecordPerformance(req)) {
    recordConnectionPauseEvent({
      connectionId: getPerformanceSessionIdFromContext(req),
      shouldRecordResult: true,
    });
  }

  if (getRequiresPollingForPerformance(req)) {
    createPerformancePollingObject({
      userId: getResolvedUserIdFromContext(req),
      connectionId,
      performanceSessionId: getPerformanceSessionIdFromContext(req),
      aggregatorId: getAggregatorFromContext(req),
      jobId: getCurrentJobIdFromContext(req),
    });
  }

  res.send({});
};
