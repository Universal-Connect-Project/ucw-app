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

  const aggregatorInstitution = await resolveInstitutionAggregator(
    ucpInstitutionId,
    req.context.jobTypes,
  );

  req.context.aggregator = aggregatorInstitution.aggregator;
  req.context.aggregatorId = aggregatorInstitution.aggregatorId;
  req.context.institutionId = aggregatorInstitution.id;
  req.context.ucpInstitutionId = ucpInstitutionId;
  req.context.resolvedUserId = null;

  const widgetAdapter = getAggregatorWidgetAdapter(req);

  const inst = await widgetAdapter.GetInstitutionById(aggregatorInstitution.id);

  return mapResolvedInstitution(inst);
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
