import { PLAID_BASE_PATH, PLAID_BASE_PATH_PROD } from "../apiClient";
import { http, HttpResponse } from "msw";

export const CREATE_USER_PATH = `${PLAID_BASE_PATH}/aggregation/v2/customers/active`;
export const DELETE_USER_PATH = `${PLAID_BASE_PATH}/aggregation/v1/customers/:customerId`;

const handlers = [
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
  http.delete(DELETE_USER_PATH, () => new HttpResponse(null, { status: 200 })),
];

export default handlers;
