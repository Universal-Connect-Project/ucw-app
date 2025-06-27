import type { Request, Response } from "express";
import { getRecommendedInstitutions } from "../services/ElasticSearchClient";
import type { CachedInstitution } from "@repo/utils";
import { mapCachedInstitution } from "./utils";

export const getRecommendedInstitutionsHandler = async (
  req: Request,
  res: Response,
) => {
  // req.context.aggregator = null;

  const recommendedInstitutions = await getRecommendedInstitutions({
    jobTypes: req.context.jobTypes,
    aggregator: req.context.aggregator,
  });

  res.send(
    recommendedInstitutions
      .filter((ins: CachedInstitution) => ins != null)
      .map(mapCachedInstitution),
  );
};
