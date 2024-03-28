const providerCredentials = {
  mxInt: {
    username: Cypress.env('mx_client_id'),
    password: Cypress.env('mx_api_secret'),
    basePath: 'https://int-api.mx.com',
    vcEndpoint: 'https://int-api.mx.com/',
    provider: 'mx_int',
    available: true
  },
  mxProd: {
    username: Cypress.env('mx_client_id_prod'),
    password: Cypress.env('mx_api_secret_prod'),
    basePath: 'https://api.mx.com',
    vcEndpoint: 'https://api.mx.com/',
    provider: 'mx',
    available: true
  },
  akoyaSandbox: {
    clientId: Cypress.env('akoya_client_id'),
    secret: Cypress.env('akoya_api_secret'),
    basePath: 'sandbox-idp.ddp.akoya.com',
    productPath: 'sandbox-products.ddp.akoya.com',
    provider: 'akoya_sandbox',
    available: true
  },
  akoyaProd: {
    clientId: Cypress.env('akoya_client_id_prod'),
    secret: Cypress.env('akoya_api_secret_prod'),
    basePath: 'idp.ddp.akoya.com',
    productPath: 'products.ddp.akoya.com',
    provider: 'akoya',
    available: true
  },
  finicitySandbox: {
    basePath: 'https://api.finicity.com',
    partnerId: Cypress.env('finicity_partner_id'),
    appKey: Cypress.env('finicity_app_key'),
    secret: Cypress.env('finicity_secret'),
    provider: 'finicity_sandbox',
    available: true
  },
  finicityProd: {
    basePath: 'https://api.finicity.com',
    partnerId: Cypress.env('finicity_partner_id_prod'),
    appKey: Cypress.env('finicity_app_key_prod'),
    secret: Cypress.env('finicity_secret_prod'),
    provider: 'finicity',
    available: true
  },
  sophtron: {
    clientId: Cypress.env('sophtron_api_user_id'),
    secret: Cypress.env('sophtron_api_user_secret'),
    endpoint: Cypress.env('sophtron_api_service_endpoint'),
    vcEndpoint: Cypress.env('sophtron_vc_service_endpoint'),
    provider: 'sophtron',
    available: true
  }
}

export default providerCredentials
