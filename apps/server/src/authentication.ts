import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import config from "./config";
import type {
  Request,
  RequestHandler,
  Response,
  Express,
  NextFunction,
} from "express";
import { del, get, set } from "./services/storageClient/redis";

export const tokenCookieName = "authorizationToken";

export const getTokenHandler = async (req: Request, res: Response) => {
  const authorizationHeaderToken = req.headers.authorization?.split(
    " ",
  )?.[1] as string;

  const uuid = crypto.randomUUID();

  await set(uuid, authorizationHeaderToken, { EX: 60 * 5 });

  res.json({
    token: uuid,
  });
};

export const tokenAuthenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.query?.token as string;

  if (token) {
    const authorizationJWT = await get(token);

    if (!authorizationJWT) {
      res.send("token invalid or expired");
      res.status(401);

      return;
    }

    await del(token);

    req.headers.authorization = `Bearer ${authorizationJWT}`;

    res.cookie(tokenCookieName, authorizationJWT, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
  }

  next();
};

const cookieAuthenticationMiddleware = async (
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

  app.get("/api/token", getTokenHandler as RequestHandler);
};

export default useAuthentication;
