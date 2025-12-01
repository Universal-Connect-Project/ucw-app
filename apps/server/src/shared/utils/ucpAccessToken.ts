import { createM2MTokenHandler } from "./m2mToken";
import config from "../../config";

// TODO: Implement redis caching

export const m2mTokenHandler = createM2MTokenHandler({
  audience: "ucp-widget-interactions",
  clientId: config.UCP_CLIENT_ID,
  clientSecret: config.UCP_CLIENT_SECRET,
  domain: config.UCP_AUTH0_DOMAIN,
  fileName: "ucpAccessToken",
});

export const getUCPAccessToken = m2mTokenHandler.getToken;
