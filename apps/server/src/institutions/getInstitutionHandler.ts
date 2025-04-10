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

const getAggregatorInstitutionByUCPId = async (req: Request) => {
  const ucpInstitutionId = req.params.institution_guid;

  const resolvedInstitution = await resolveInstitutionAggregator(
    ucpInstitutionId,
    req.context.jobTypes,
  );

  req.context.aggregator = resolvedInstitution.aggregator;
  req.context.institutionId = resolvedInstitution.id;
  req.context.resolvedUserId = null;

  const widgetAdapter = getAggregatorWidgetAdapter(req);

  const inst = await widgetAdapter.GetInstitutionById(resolvedInstitution.id);

  return mapResolvedInstitution({
    ...inst,
    name: resolvedInstitution.name,
    url: resolvedInstitution.url,
    logo_url: resolvedInstitution.logo_url,
  });
};

const getInstitutionByAggregatorId = async (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const aggregatorAdapter = getAggregatorWidgetAdapter(req);

  const aggregatorInstitutionId = req.params.institution_guid;

  const institution = await aggregatorAdapter.GetInstitutionById(
    aggregatorInstitutionId,
  );

  return mapResolvedInstitution(institution);
};

export const getInstitutionHandler = async (req: Request, res: Response) => {
  if (req.context?.aggregator) {
    const institution = await getInstitutionByAggregatorId(req);

    res.send(institution);

    return;
  }

  const ret = await getAggregatorInstitutionByUCPId(req);
  res.send(ret);
};
