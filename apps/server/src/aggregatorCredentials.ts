import config from "./config";

const aggregatorCredentials = {
  mxInt: {
    username: config.MX_CLIENT_ID,
    password: config.MX_API_SECRET,
    basePath: "https://int-api.mx.com",
    vcEndpoint: "https://int-api.mx.com/",
    aggregator: "mx_int",
    available: true,
  },
  mxProd: {
    username: config.MX_CLIENT_ID_PROD,
    password: config.MX_API_SECRET_PROD,
    basePath: "https://api.mx.com",
    vcEndpoint: "https://api.mx.com/",
    aggregator: "mx",
    available: true,
  },
  akoyaSandbox: {
    clientId: config.AkoyaClientId,
    secret: config.AkoyaApiSecret,
    basePath: "sandbox-idp.ddp.akoya.com",
    productPath: "sandbox-products.ddp.akoya.com",
    aggregator: "akoya_sandbox",
    available: true,
  },
  akoyaProd: {
    clientId: config.AkoyaClientIdProd,
    secret: config.AkoyaApiSecretProd,
    basePath: "idp.ddp.akoya.com",
    productPath: "products.ddp.akoya.com",
    aggregator: "akoya",
    available: true,
  },
  finicityProd: {
    basePath: "https://api.finicity.com",
    partnerId: config.FINICITY_PARTNER_ID,
    appKey: config.FINICITY_APP_KEY,
    secret: config.FINICITY_SECRET,
    aggregator: "finicity",
    available: true,
  },
};

export default aggregatorCredentials;
