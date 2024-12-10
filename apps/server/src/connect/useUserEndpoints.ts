import type { Express, RequestHandler } from "express";
import { auth, requiredScopes } from "express-oauth2-jwt-bearer";

import { userDeleteHandler } from "./userEndpoints";
import { getConfig } from "../config";

const useUserEndpoints = (app: Express) => {
  const config = getConfig();

  const deleteUserEndpointMiddleware: RequestHandler[] = [];

  if (config.DELETE_USER_ENDPOINT_AUTHENTICATION_ENABLE === "true") {
    if (
      config.DELETE_USER_ENDPOINT_AUTHENTICATION_AUDIENCE &&
      config.DELETE_USER_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL &&
      config.DELETE_USER_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG
    ) {
      deleteUserEndpointMiddleware.push(
        auth({
          audience: config.DELETE_USER_ENDPOINT_AUTHENTICATION_AUDIENCE,
          issuerBaseURL:
            config.DELETE_USER_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL,
          tokenSigningAlg:
            config.DELETE_USER_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG,
        }),
      );
    }

    if (config.DELETE_USER_ENDPOINT_AUTHENTICATION_SCOPES) {
      deleteUserEndpointMiddleware.push(
        requiredScopes(config.DELETE_USER_ENDPOINT_AUTHENTICATION_SCOPES),
      );
    }
  }

  if (config.DELETE_USER_ENDPOINT_ENABLE === "true") {
    app.delete(
      "/api/aggregator/:aggregator/user/:userId",
      deleteUserEndpointMiddleware,
      userDeleteHandler,
    );
  }
};

export default useUserEndpoints;
