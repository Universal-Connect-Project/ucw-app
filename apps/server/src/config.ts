const nonSensitiveSharedConfig = {
  AuthServiceEndpoint: "https://login.universalconnectproject.org/api",
  SearchEndpoint: "https://search.universalconnectproject.org/api/",
  AnalyticsServiceEndpoint:
    "https://analytics.universalconnectproject.org/api/",
  Component: "UniversalWidget",
  ServiceName: "universal_widget",
  CryptoAlgorithm: "aes-256-cbc",
  Auth0TokenUrl: "https://dev-d23wau8o0uc5hw8n.us.auth0.com/oauth/token",
};

const keysToPullFromEnv = [
  "PORT",

  "HOST_URL",
  "WEBHOOK_HOST_URL",
  "LOG_LEVEL",

  "UCPClientId",
  "UCPClientSecret",

  "ENV",

  "REDIS_SERVER",
  "REDIS_CACHE_TIME_SECONDS",

  "SOPHTRON_API_USER_ID",
  "SOPHTRON_API_USER_SECRET",

  "MX_CLIENT_ID",
  "MX_API_SECRET",
  "MX_CLIENT_ID_PROD",
  "MX_API_SECRET_PROD",

  "FINICITY_PARTNER_ID",
  "FINICITY_APP_KEY",
  "FINICITY_SECRET",
  "FINICITY_PARTNER_IDProd",
  "FINICITY_APP_KEYProd",
  "FINICITY_SECRETProd",

  "ELASTIC_SEARCH_URL",
  "INSTITUTION_POLLING_INTERVAL",
  "INSTITUTION_CACHE_LIST_URL",

  "DATA_ENDPOINTS_ENABLE",

  "AUTHENTICATION_ENABLE",
  "AUTHENTICATION_AUDIENCE",
  "AUTHENTICATION_ISSUER_BASE_URL",
  "AUTHENTICATION_TOKEN_SIGNING_ALG",
  "AUTHENTICATION_SCOPES",
];

const config: Record<string, any> = keysToPullFromEnv.reduce(
  (acc, envKey) => {
    return {
      ...acc,
      [envKey]: process.env[envKey],
    };
  },
  {
    ...nonSensitiveSharedConfig,
  },
);

if (config.INSTITUTION_POLLING_INTERVAL === undefined) {
  config.INSTITUTION_POLLING_INTERVAL = 1;
}

if (config.REDIS_CACHE_TIME_SECONDS === undefined) {
  config.REDIS_CACHE_TIME_SECONDS = 600;
}

if (process.env.REDISCLOUD_URL) {
  config.REDIS_SERVER = process.env.REDISCLOUD_URL;
}

if (process.env.SEARCHBOX_URL) {
  config.ELASTIC_SEARCH_URL = process.env.SEARCHBOX_URL;
}

export const getConfig = () => config;

export default config;
