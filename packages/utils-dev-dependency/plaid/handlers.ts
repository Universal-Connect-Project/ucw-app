import { http, HttpResponse } from "msw";
import {
  accountsResponse,
  authResponse,
  identityResponse,
  plaidTransactionsResponseExample,
} from "./testData";

const PLAID_BASE_PATH = "https://sandbox.plaid.com";
const PLAID_BASE_PATH_PROD = "https://production.plaid.com";

export const plaidHandlers = [
  http.post(`${PLAID_BASE_PATH}/link/token/create`, () =>
    HttpResponse.json({
      expiration: "2025-06-23T12:54:37Z",
      link_token: "link-sandbox-9791370e-9f28-401e-af44-96031b21d98d",
      request_id: "DtPD4pznLCMKZ48",
      hosted_link_url: PLAID_BASE_PATH,
    }),
  ),
  http.post(`${PLAID_BASE_PATH_PROD}/link/token/create`, () =>
    HttpResponse.json({
      expiration: "2025-06-23T12:54:37Z",
      link_token: "link-production-9791370e-9f28-401e-af44-96031b21d98d",
      request_id: "DtPD4pznLCMKZ48",
      hosted_link_url: PLAID_BASE_PATH_PROD,
    }),
  ),
  http.post(`${PLAID_BASE_PATH}/item/public_token/exchange`, async () =>
    HttpResponse.json({
      access_token: "accessTokenTest",
      item_id: "itemIdTest",
      request_id: "requestIdTest",
    }),
  ),
  http.post(`${PLAID_BASE_PATH_PROD}/item/public_token/exchange`, async () =>
    HttpResponse.json({
      access_token: "accessTokenTest",
      item_id: "itemIdTest",
      request_id: "requestIdTest",
    }),
  ),
  http.post(`${PLAID_BASE_PATH}/item/remove`, async () =>
    HttpResponse.json({}),
  ),
  http.post(`${PLAID_BASE_PATH_PROD}/item/remove`, async () =>
    HttpResponse.json({}),
  ),
  http.post(`${PLAID_BASE_PATH}/identity/get`, () =>
    HttpResponse.json(identityResponse),
  ),
  http.post(`${PLAID_BASE_PATH}/auth/get`, () =>
    HttpResponse.json(authResponse),
  ),
  http.post(`${PLAID_BASE_PATH}/accounts/get`, () =>
    HttpResponse.json(accountsResponse),
  ),
  http.post(`${PLAID_BASE_PATH}/transactions/get`, () =>
    HttpResponse.json(plaidTransactionsResponseExample),
  ),
];
