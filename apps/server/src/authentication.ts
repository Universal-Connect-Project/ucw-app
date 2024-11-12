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

const tokenCookieName = "authorizationToken";

const requireAuth = () =>
  auth({
    audience: config.AUTHENTICATION_AUDIENCE,
    issuerBaseURL: config.AUTHENTICATION_ISSUER_BASE_URL,
    tokenSigningAlg: config.AUTHENTICATION_TOKEN_SIGNING_ALG,
  });
const requireScopes = () => requiredScopes(config.AUTHENTICATION_SCOPES);

const getTokenHandler = async (req: Request, res: Response) => {
  const authorizationHeaderToken = req.headers.authorization?.split(
    " ",
  )?.[1] as string;

  const uuid = crypto.randomUUID();

  set(uuid, authorizationHeaderToken, { EX: 60 * 5 });

  res.json({
    token: uuid,
  });
};

const tokenAuthenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.query?.token as string;

  if (token && !req.headers.authorization) {
    const authorizationToken = await get(token);

    if (!authorizationToken) {
      res.send("token expired");
      res.status(401);

      return;
    }

    del(token);

    req.headers.authorization = `Bearer ${authorizationToken}`;

    res.cookie(tokenCookieName, authorizationToken, {
      httpOnly: true,
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
    app.use(requireAuth());
  }

  if (config.AUTHENTICATION_SCOPES) {
    app.use(requireScopes());
  }

  app.get("/token", getTokenHandler as RequestHandler);
};

export default useAuthentication;
