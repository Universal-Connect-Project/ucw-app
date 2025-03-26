import { resolveInstitutionAggregator } from "../services/institutionResolver";
import type { Request } from "express";
import { getAggregatorWidgetAdapter } from "./getAggregatorWidgetAdapter";
import { mapResolvedInstitution } from "../connect/connectApi";

export const getAggregatorInstitutionByUCPId = async (req: Request) => {
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
  if (inst != null) {
    inst.name = aggregatorInstitution.name ?? inst.name;
    inst.url = aggregatorInstitution?.url ?? inst.url?.trim();
    inst.logo_url = aggregatorInstitution?.logo_url ?? inst.logo_url?.trim();
  }

  return mapResolvedInstitution(inst);
};
