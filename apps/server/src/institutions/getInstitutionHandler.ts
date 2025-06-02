import type { Request, Response } from "express";
import { getAggregatorWidgetAdapter } from "../adapters/getAggregatorWidgetAdapter";
import { resolveInstitutionAggregator } from "./institutionResolver";

export const getInstitutionHandler = async (req: Request, res: Response) => {
  const ucpInstitutionId = req.params.institution_guid;
  req.context.latestResolvedInstitutionId = ucpInstitutionId;

  const resolvedInstitution = await resolveInstitutionAggregator({
    aggregatorOverride: req.context.aggregator,
    ucpInstitutionId: ucpInstitutionId,
    jobTypes: req.context.jobTypes,
  });

  req.context.aggregator = resolvedInstitution.aggregator;
  req.context.resolvedUserId = null;

  const widgetAdapter = getAggregatorWidgetAdapter(req);

  const inst = await widgetAdapter.GetInstitutionById(resolvedInstitution.id);

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
};
