import type { Request, Response } from "express";
import {
  getShouldRecordPerformance,
  getShouldRecordPerformanceDuration,
} from "../shared/utils/performance";
import { recordStartEvent } from "../services/performanceTracking";
import { getAggregatorIdFromTestAggregatorId } from "../adapterIndex";

export interface StartOauthPerformanceRequest extends Request {
  body: {
    connectionId: string;
    institutionId: string;
  };
}

export const startOauthPerformance = async (
  req: StartOauthPerformanceRequest,
  res: Response,
) => {
  const {
    body: { connectionId, institutionId },
  } = req;
  const {
    context: { aggregator, jobTypes, performanceSessionId },
  } = req;

  const aggregatorId = getAggregatorIdFromTestAggregatorId(aggregator);

  if (getShouldRecordPerformance(req)) {
    recordStartEvent({
      aggregatorId,
      connectionId: performanceSessionId,
      institutionId: institutionId,
      jobTypes: jobTypes,
      recordDuration: getShouldRecordPerformanceDuration(req),
    });
  }

  // if (startEvent && memberData.is_oauth) {
  //   startEvent.then(() =>
  //     recordConnectionPauseEvent(performanceSessionId, false),
  //   );
  // }

  // if (
  //   getShouldRecordPerformance(this.req) &&
  //   this.getRequiresPollingForPerformance()
  // ) {
  //   createPerformancePollingObject({
  //     userId: this.getUserId(),
  //     connectionId: connection.id,
  //     performanceSessionId,
  //     aggregatorId: this.context.aggregator, // Must use the original aggregator string to request status from sandbox or prod adapters.
  //     jobId: this.context.current_job_id,
  //   });
  // }
  // if (getConnectionCleanUpFeatureEnabled()) {
  //   setConnectionForCleanup({
  //     id: performanceSessionId,
  //     connectionId: connection.id,
  //     createdAt: Date.now(),
  //     aggregatorId: this.context.aggregator, // Must use the original aggregator string to delete connection from sandbox or prod adapters.
  //     userId: this.getUserId(),
  //   });
  // }

  res.send({});
};
