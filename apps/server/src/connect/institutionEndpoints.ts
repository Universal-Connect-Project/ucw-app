import type { Request, Response } from "express";

import type { MappedJobTypes } from "@repo/utils";
import { mapCachedInstitution } from "./connectApi";
import { search, searchByRoutingNumber } from "../services/ElasticSearchClient";
import type { ConnectApi } from "./connectApi";

export interface InstitutionRequest extends Request {
  connectApi: ConnectApi;
}

export const getInstitutionHandler = async (
  req: InstitutionRequest,
  res: Response,
) => {
  if (req.context?.aggregator) {
    const institution = await req.connectApi.loadInstitutionByAggregatorId(
      req.params.institution_guid,
    );

    res.send(institution);

    return;
  }

  const ret = await req.connectApi.loadInstitutionByUcpId(
    req.params.institution_guid,
  );
  res.send(ret);
};

export interface GetInstitutionsRequest extends InstitutionRequest {
  context: {
    job_type: MappedJobTypes;
  };
  query: {
    page?: string;
    pageSize?: string;
    routingNumber?: string;
    search?: string;
  };
}

export const getInstitutionsHandler = async (
  req: GetInstitutionsRequest,
  res: Response,
) => {
  let institutionHits;

  const jobType = req.context?.job_type;
  const { routingNumber, search: searchTerm } = req.query;

  const size = parseInt(req.query.pageSize);
  const from = (parseInt(req.query.page) - 1) * size;

  if (req.query.routingNumber) {
    institutionHits = await searchByRoutingNumber({
      from,
      jobType,
      routingNumber,
      size,
    });
  } else {
    institutionHits = await search({
      from,
      jobType,
      searchTerm,
      size,
    });
  }

  res.send(institutionHits.map(mapCachedInstitution));
};

export const recommendedInstitutionsHandler = async (
  req: InstitutionRequest,
  res: Response,
) => {
  const popularInstitutions = await req.connectApi.loadPopularInstitutions();

  res.send(popularInstitutions);
};

export interface GetInstitutionCredentialsRequest extends InstitutionRequest {
  params: {
    institution_guid: string;
  };
}

export const getInstitutionCredentialsHandler = async (
  req: GetInstitutionCredentialsRequest,
  res: Response,
) => {
  const credentials = await req.connectApi.getInstitutionCredentials(
    req.params.institution_guid,
  );
  res.send(credentials);
};
