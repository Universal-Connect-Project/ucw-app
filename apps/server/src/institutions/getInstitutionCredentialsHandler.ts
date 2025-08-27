import type { Request, Response } from "express";
import { getAggregatorWidgetAdapter } from "../adapters/getAggregatorWidgetAdapter";
import {
  recordConnectionPauseEvent,
  recordConnectionResumeEvent,
} from "../services/performanceTracking";
import {
  getPerformanceSessionIdFromContext,
  setCurrentJobIdOnContext,
} from "../shared/utils/context";
import { getShouldRecordPerformance } from "../shared/utils/performance";

export interface GetInstitutionCredentialsRequest extends Request {
  params: {
    institution_guid: string;
  };
}

export const getInstitutionCredentialsHandler = async (
  req: GetInstitutionCredentialsRequest,
  res: Response,
) => {
  setCurrentJobIdOnContext({
    currentJobId: null,
    req,
  });
  const aggregatorInstitutionId = req.params.institution_guid;

  let resumeEvent;

  const performanceSessionId = getPerformanceSessionIdFromContext(req);

  try {
    if (getShouldRecordPerformance(req)) {
      resumeEvent = recordConnectionResumeEvent(performanceSessionId);
    }

    const aggregatorAdapter = getAggregatorWidgetAdapter(req);

    const credentials = await aggregatorAdapter.ListInstitutionCredentials(
      aggregatorInstitutionId,
    );

    resumeEvent?.then(() => {
      recordConnectionPauseEvent(performanceSessionId);
    });

    res.send(
      credentials.map((c) => ({
        ...c,
        guid: c.id,
        field_type: c.field_type === "PASSWORD" ? 1 : 3,
      })),
    );
  } catch (error) {
    resumeEvent?.then(() => {
      recordConnectionPauseEvent(performanceSessionId);
      // set shouldRecordResult to true
    });

    res.status(400).send("Something went wrong");
  }
};
