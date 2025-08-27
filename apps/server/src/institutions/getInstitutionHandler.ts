import type { Request, Response } from "express";
import { getAggregatorWidgetAdapter } from "../adapters/getAggregatorWidgetAdapter";
import { resolveInstitutionAggregator } from "./institutionResolver";
import {
  recordConnectionPauseEvent,
  recordStartEvent,
  setPerformanceSessionId,
} from "../services/performanceTracking";
import {
  getShouldRecordPerformance,
  getShouldRecordPerformanceDuration,
} from "../shared/utils/performance";
import { getAggregatorIdFromTestAggregatorId } from "../adapterIndex";
import {
  getAggregatorFromContext,
  getAggregatorOverrideFromContext,
  getJobTypesFromContext,
  setAggregatorOnContext,
  setResolvedUserIdOnContext,
} from "../shared/utils/context";

export const getInstitutionHandler = async (req: Request, res: Response) => {
  const ucpInstitutionId = req.params.institution_guid;
  const performanceSessionId = setPerformanceSessionId(req);
  const jobTypes = getJobTypesFromContext(req);

  const resolvedInstitution = await resolveInstitutionAggregator({
    aggregatorOverride:
      getAggregatorOverrideFromContext(req) || getAggregatorFromContext(req),
    ucpInstitutionId: ucpInstitutionId,
    jobTypes,
  });

  const resolvedAggregatorId = resolvedInstitution.aggregator;

  setAggregatorOnContext({ aggregatorId: resolvedAggregatorId, req });
  setResolvedUserIdOnContext({ resolvedUserId: null, req });

  let startEvent;

  try {
    const widgetAdapter = getAggregatorWidgetAdapter(req);

    const shouldRecordPerformance = getShouldRecordPerformance(req);

    if (shouldRecordPerformance) {
      startEvent = recordStartEvent({
        aggregatorId: getAggregatorIdFromTestAggregatorId(resolvedAggregatorId),
        connectionId: performanceSessionId,
        institutionId: ucpInstitutionId,
        jobTypes,
        recordDuration: getShouldRecordPerformanceDuration(req),
      });
    }

    const inst = await widgetAdapter.GetInstitutionById(resolvedInstitution.id);

    startEvent?.then(() => {
      recordConnectionPauseEvent({ connectionId: performanceSessionId });
    });

    const name = resolvedInstitution.name;

    res.send({
      guid: inst.id,
      code: inst.id,
      name,
      logo_url: resolvedInstitution.logo_url,
      instructional_data: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      supports_oauth: inst.supportsOauth,
      aggregator: inst.aggregator,
      ucpInstitutionId,
      url: resolvedInstitution.url,
    });
  } catch (error) {
    startEvent?.then(() => {
      recordConnectionPauseEvent({ connectionId: performanceSessionId });
      // set shouldRecordResult to true
    });

    res.status(400).send("Something went wrong");
  }
};
