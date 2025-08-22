import type { Request, Response } from "express";
import {
  getShouldRecordPerformance,
  getShouldRecordPerformanceDuration,
} from "../shared/performance";
import { recordStartEvent } from "../services/performanceTracking";
import { getAggregatorIdFromTestAggregatorId } from "../adapterIndex";

export interface StartOauthPerformanceRequest extends Request {
  body: {
    institutionId: string;
  };
}

export const startOauthPerformance = async (
  req: StartOauthPerformanceRequest,
  res: Response,
) => {
  const {
    body: { institutionId },
  } = req;

  const aggregatorId = getAggregatorIdFromTestAggregatorId(
    req.context.aggregator,
  );

  if (getShouldRecordPerformance(req)) {
    recordStartEvent({
      aggregatorId,
      connectionId: req.context.performanceSessionId,
      institutionId: institutionId,
      jobTypes: req.context.jobTypes,
      recordDuration: getShouldRecordPerformanceDuration(req),
    });
  }

  res.send({});
};
