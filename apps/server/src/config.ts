import "./dotEnv";

const keysToPullFromEnv = [
  "AUTH0_TOKEN_URL",

  "NGROK_AUTHTOKEN",

  "PORT",

  "HOST_URL",
  "WEBHOOK_HOST_URL",
  "LOG_LEVEL",

  "UCP_CLIENT_ID",
  "UCP_CLIENT_SECRET",

  "ENV",

  "REDIS_SERVER",
  "REDIS_CACHE_TIME_SECONDS",
  "REDIS_ENABLE_TLS",

  "SOPHTRON_API_USER_ID",
  "SOPHTRON_API_USER_SECRET",

  "MX_CLIENT_ID",
  "MX_API_SECRET",
  "MX_CLIENT_ID_PROD",
  "MX_API_SECRET_PROD",

  "FINICITY_PARTNER_ID",
  "FINICITY_APP_KEY",
  "FINICITY_SECRET",
  "FINICITY_PARTNER_ID_PROD",
  "FINICITY_APP_KEY_PROD",
  "FINICITY_SECRET_PROD",

  "AKOYA_CLIENT_ID",
  "AKOYA_CLIENT_ID_PROD",
  "AKOYA_SECRET",
  "AKOYA_SECRET_PROD",

  "PLAID_CLIENT_NAME",
  "PLAID_CLIENT_ID",
  "PLAID_SECRET",
  "PLAID_SECRET_PROD",

  "ELASTIC_SEARCH_URL",
  "ELASTIC_SEARCH_SINGLE_THREAD",
  "INSTITUTION_POLLING_INTERVAL",
  "INSTITUTION_CACHE_LIST_URL",

  "PERFORMANCE_SERVICE_URL",

  "DATA_ENDPOINTS_ENABLE",
  "DELETE_USER_ENDPOINT_ENABLE",

  "AUTHENTICATION_ENABLE",
  "AUTHENTICATION_AUDIENCE",
  "AUTHENTICATION_ISSUER_BASE_URL",
  "AUTHENTICATION_TOKEN_SIGNING_ALG",
  "AUTHENTICATION_SCOPES",

  "DATA_ENDPOINT_AUTHENTICATION_ENABLE",
  "DATA_ENDPOINT_AUTHENTICATION_AUDIENCE",
  "DATA_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL",
  "DATA_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG",
  "DATA_ENDPOINT_AUTHENTICATION_SCOPES",

  "DELETE_USER_ENDPOINT_AUTHENTICATION_ENABLE",
  "DELETE_USER_ENDPOINT_AUTHENTICATION_AUDIENCE",
  "DELETE_USER_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL",
  "DELETE_USER_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG",
  "DELETE_USER_ENDPOINT_AUTHENTICATION_SCOPES",

  "PROXY_HOST",
  "PROXY_PORT",
  "PROXY_USERNAME",
  "PROXY_PASSWORD",

  "AUTHORIZATION_TOKEN_COOKIE_SAMESITE",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: Record<string, any> = keysToPullFromEnv.reduce((acc, envKey) => {
  return {
    ...acc,
    [envKey]: process.env[envKey],
  };
}, {});

if (process.env.HEROKU_APP_NAME) {
  config.HOST_URL = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  config.WEBHOOK_HOST_URL = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
}
if (config.INSTITUTION_POLLING_INTERVAL === undefined) {
  config.INSTITUTION_POLLING_INTERVAL = 1;
}

if (config.REDIS_CACHE_TIME_SECONDS === undefined) {
  config.REDIS_CACHE_TIME_SECONDS = 600;
}

if (process.env.UPSTASH_REDIS_URL) {
  config.REDIS_SERVER = process.env.UPSTASH_REDIS_URL;
}

if (process.env.BONSAI_URL) {
  config.ELASTIC_SEARCH_URL = process.env.BONSAI_URL;
}

export const getConfig = () => config;

export default config;
