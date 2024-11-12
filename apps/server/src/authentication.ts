import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import config from "./config";
import type { Express } from "express";

const useAuthentication = (app: Express) => {
  if (
    config.AUTHENTICATION_AUDIENCE &&
    config.AUTHENTICATION_ISSUER_BASE_URL &&
    config.AUTHENTICATION_TOKEN_SIGNING_ALG
  ) {
    app.use(
      auth({
        audience: config.AUTHENTICATION_AUDIENCE,
        issuerBaseURL: config.AUTHENTICATION_ISSUER_BASE_URL,
        tokenSigningAlg: config.AUTHENTICATION_TOKEN_SIGNING_ALG,
      }),
    );
  }

  if (config.AUTHENTICATION_SCOPES) {
    app.use(requiredScopes(config.AUTHENTICATION_SCOPES));
  }
};

export default useAuthentication;
