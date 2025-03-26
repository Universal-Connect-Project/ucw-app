import { type Application } from "express";
import { INSTITUTION_ENDPOINT_URL } from "./constants";
import {
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
} from "@repo/utils";
import { getRecommendedInstitutionsHandler } from "./getRecommendedInstitutionsHandler";
import { getInstitutionHandler } from "./getInstitutionHandler";
import { getSearchInstitutionsHandler } from "./getSearchInstitutionsHandler";
import { getInstitutionCredentialsHandler } from "./getInstitutionCredentialsHandler";

const useInstitutionEndpoints = (app: Application) => {
  app.get(
    `${INSTITUTION_ENDPOINT_URL}/:institution_guid/credentials`,
    getInstitutionCredentialsHandler,
  );

  app.get(RECOMMENDED_INSTITUTIONS_URL, getRecommendedInstitutionsHandler);

  app.get(
    `${INSTITUTION_ENDPOINT_URL}/:institution_guid`,
    getInstitutionHandler,
  );

  app.get(SEARCH_INSTITUTIONS_URL, getSearchInstitutionsHandler);
};

export default useInstitutionEndpoints;
