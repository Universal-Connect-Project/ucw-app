import config from "../config";
import { warning as logWarning } from "../infra/logger";
import { get, set } from "./storageClient/redis";

export const REDIS_AUTH_ACCESS_KEY = "auth0AccessToken";

export async function getAccessToken() {
  const { AUTH0_TOKEN_URL, UCP_CLIENT_ID, UCP_CLIENT_SECRET } = config;

  const cachedAccessToken = await get(REDIS_AUTH_ACCESS_KEY);
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const response = await fetch(AUTH0_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      audience: "ucp-widget-interactions",
      client_id: UCP_CLIENT_ID,
      client_secret: UCP_CLIENT_SECRET,
    }),
  });
  if (response.status === 401) {
    logWarning("Unauthorized to retrieve UCP access token");
    throw new Error("Unauthorized");
  }
  try {
    if (response.ok) {
      const responseJson = await response.json();
      await set(REDIS_AUTH_ACCESS_KEY, responseJson.access_token, {
        EX: responseJson.expires_in,
      });

      return responseJson.access_token;
    } else {
      throw new Error("Response not ok");
    }
  } catch (error) {
    throw new Error(`Could not get UCP access token: ${error.message}`);
  }
}
