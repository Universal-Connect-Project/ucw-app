import type { Request, Response } from "express";
import { getAggregatorWidgetAdapter } from "../adapters/getAggregatorWidgetAdapter";
import type { AggregatorInstitution } from "@repo/utils";
import { resolveInstitutionAggregator } from "./institutionResolver";

const mapResolvedInstitution = (ins: AggregatorInstitution) => {
  return {
    guid: ins.id,
    code: ins.id,
    name: ins.name,
    url: ins.url,
    logo_url: ins.logo_url,
    instructional_data: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credentials: [] as any[],
    supports_oauth: ins.oauth ?? ins.name?.includes("Oauth"),
    aggregator: ins.aggregator,
  };
};

export const getInstitutionHandler = async (req: Request, res: Response) => {
  const ucpInstitutionId =
    req.context.institutionId || req.params.institution_guid;

  const resolvedInstitution = await resolveInstitutionAggregator({
    aggregatorOverride: req.context.aggregator,
    ucpInstitutionId: ucpInstitutionId,
    jobTypes: req.context.jobTypes,
  });

  req.context.aggregator = resolvedInstitution.aggregator;
  req.context.institutionId = resolvedInstitution.id;
  req.context.resolvedUserId = null;

  const widgetAdapter = getAggregatorWidgetAdapter(req);

  const inst = await widgetAdapter.GetInstitutionById(resolvedInstitution.id);

  res.send({
    ...mapResolvedInstitution({
      ...inst,
      name: resolvedInstitution.name,
      url: resolvedInstitution.url,
      logo_url: resolvedInstitution.logo_url,
    }),
    ucpInstitutionId,
  });
};
