import { createM2MTokenHandler } from "./m2mToken";
import config from "../../config";
import { get, set } from "../../services/storageClient/redis";

const REDIS_ACCESS_TOKEN_KEY = "ucpAccessToken";

const getTokenFromCache = async () => await get(REDIS_ACCESS_TOKEN_KEY);

const setTokenInCache = async ({
  expireIn,
  token,
}: {
  expireIn: number;
  token: string;
}) => {
  await set(REDIS_ACCESS_TOKEN_KEY, token, { EX: expireIn });
};

export const m2mTokenHandler = createM2MTokenHandler({
  audience: "ucp-widget-interactions",
  clientId: config.UCP_CLIENT_ID,
  clientSecret: config.UCP_CLIENT_SECRET,
  getTokenFromCache,
  domain: config.UCP_AUTH0_DOMAIN,
  fileName: "ucpAccessToken",
  setTokenInCache,
});

export const getUCPAccessToken = m2mTokenHandler.getToken;
