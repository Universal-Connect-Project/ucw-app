import type { ComboJobTypes } from "@repo/utils";
import type { Request, Response } from "express";
import { search, searchByRoutingNumber } from "../services/ElasticSearchClient";
import { mapCachedInstitution } from "./utils";

export interface GetInstitutionsRequest extends Request {
  context: {
    jobTypes: ComboJobTypes[];
  };
  query: {
    page?: string;
    pageSize?: string;
    routingNumber?: string;
    search?: string;
  };
}

export const getSearchInstitutionsHandler = async (
  req: GetInstitutionsRequest,
  res: Response,
) => {
  let institutionHits;

  const jobTypes = req.context?.jobTypes;
  const { routingNumber, search: searchTerm } = req.query;

  const size = parseInt(req.query.pageSize);
  const from = (parseInt(req.query.page) - 1) * size;

  if (req.query.routingNumber) {
    institutionHits = await searchByRoutingNumber({
      from,
      jobTypes,
      routingNumber,
      size,
    });
  } else {
    institutionHits = await search({
      from,
      jobTypes,
      searchTerm,
      size,
    });
  }

  res.send(institutionHits.map(mapCachedInstitution));
};
