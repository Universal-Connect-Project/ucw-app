import type { Express, RequestHandler } from "express";
import {
  createAccountsDataHandler,
  createIdentityDataHandler,
  createTransactionsDataHandler,
} from "./dataEndpoints";
import { getConfig } from "../config";
import { auth, requiredScopes } from "express-oauth2-jwt-bearer";

const useDataEndpoints = (app: Express) => {
  const config = getConfig();

  const dataEndpointMiddleware: RequestHandler[] = [];

  if (config.DATA_ENDPOINT_AUTHENTICATION_ENABLE === "true") {
    if (
      config.DATA_ENDPOINT_AUTHENTICATION_AUDIENCE &&
      config.DATA_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL &&
      config.DATA_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG
    ) {
      dataEndpointMiddleware.push(
        auth({
          audience: config.DATA_ENDPOINT_AUTHENTICATION_AUDIENCE,
          issuerBaseURL: config.DATA_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL,
          tokenSigningAlg:
            config.DATA_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG,
        }),
      );
    }

    if (config.DATA_ENDPOINT_AUTHENTICATION_SCOPES) {
      dataEndpointMiddleware.push(
        requiredScopes(config.DATA_ENDPOINT_AUTHENTICATION_SCOPES),
      );
    }
  }

  if (config.DATA_ENDPOINTS_ENABLE === "true") {
    app.get(
      "/api/data/accounts",
      dataEndpointMiddleware,
      createAccountsDataHandler(false),
    );
    app.get(
      "/api/data/identity",
      dataEndpointMiddleware,
      createIdentityDataHandler(false),
    );
    app.get(
      "/api/data/transactions",
      dataEndpointMiddleware,
      createTransactionsDataHandler(false),
    );

    app.get(
      "/api/vc/data/accounts",
      dataEndpointMiddleware,
      createAccountsDataHandler(true),
    );
    app.get(
      "/api/vc/data/identity",
      dataEndpointMiddleware,
      createIdentityDataHandler(true),
    );
    app.get(
      "/api/vc/data/transactions",
      dataEndpointMiddleware,
      createTransactionsDataHandler(true),
    );
  }
};

export default useDataEndpoints;
