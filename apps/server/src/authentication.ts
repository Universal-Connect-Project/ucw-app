import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import { getConfig } from "./config";
import type { Request, Response, Express, NextFunction } from "express";
import { get, set } from "./services/storageClient/redis";

export const tokenCookieName = "authorizationToken";

export const tokenAuthenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.query?.token as string;

  if (token) {
    const redisKey = `token-${token}`;
    const { authorizationJwt, ...widgetParams } = await get(redisKey);
    await set(redisKey, widgetParams);

    const config = getConfig();

    if (!authorizationJwt) {
      res.send("token invalid or expired");
      res.status(401);

      return;
    }

    req.headers.authorization = `Bearer ${authorizationJwt}`;

    res.cookie(tokenCookieName, authorizationJwt, {
      httpOnly: true,
      sameSite: config.AUTHORIZATION_TOKEN_COOKIE_SAMESITE || "strict",
      secure: true,
    });
  }

  next();
};

export const cookieAuthenticationMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const cookieAuthorizationToken = req.cookies[tokenCookieName];

  if (cookieAuthorizationToken && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${cookieAuthorizationToken}`;
  }

  next();
};

const useAuthentication = (app: Express) => {
  const config = getConfig();

  if (config.AUTHENTICATION_ENABLE !== "true") {
    return;
  }

  app.use(tokenAuthenticationMiddleware);
  app.use(cookieAuthenticationMiddleware);

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
