import config from "./config";

const aggregatorCredentials = {
  mxInt: {
    username: config.MxClientId,
    password: config.MxApiSecret,
    basePath: "https://int-api.mx.com",
    vcEndpoint: "https://int-api.mx.com/",
    aggregator: "mx_int",
    available: true,
  },
  mxProd: {
    username: config.MxClientIdProd,
    password: config.MxApiSecretProd,
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
    partnerId: config.FinicityPartnerId,
    appKey: config.FinicityAppKey,
    secret: config.FinicitySecret,
    aggregator: "finicity",
    available: true,
  },
};

export default aggregatorCredentials;
