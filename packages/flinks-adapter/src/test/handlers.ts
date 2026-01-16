import { http, HttpResponse } from "msw";

import { BASE_PATH as FLINKS_BASE_PATH } from "../apiClient";

import { customerData } from "./testData/users";
import {
  accountsData,
  accountTransactionsData,
  accountOwnerData,
  accountAchData,
} from "./testData/accounts";
const FLINKS_INT_BASE_PATH = "https://int-api.flinks.com";

export const CREATE_USER_PATH = `${FLINKS_BASE_PATH}/aggregation/v2/customers/active`;
export const DELETE_USER_PATH = `${FLINKS_BASE_PATH}/aggregation/v1/customers/:customerId`;
export const MOCKED_OAUTH_URL = "http://example.url";
export const MOCKED_FIX_OAUTH_URL = "http://fix.example.url";

export const FLINKS_HISTORIC_TRANSACTIONS_PATH = `${FLINKS_BASE_PATH}/aggregation/v1/customers/:customerId/accounts/:accountId/transactions/historic`;

const handlers = [
  http.post(
    `${FLINKS_BASE_PATH}/aggregation/v2/partners/authentication`,
    () => HttpResponse.json({ token: "mocked-token" }),
  ),
  http.post(
    `${FLINKS_INT_BASE_PATH}/aggregation/v2/partners/authentication`,
    () => HttpResponse.json({ token: "mocked-int-token" }),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/institution/v2/institutions/nonExistingId`,
    () => HttpResponse.json({}),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v1/customers/:customerId/accounts/:accountId/details`,
    () => HttpResponse.json(accountAchData),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v1/customers/${customerData.customers[0].id}`,
    () => HttpResponse.json(customerData.customers[0]),
  ),
  http.get(`${FLINKS_BASE_PATH}/aggregation/v1/customers/:customerId`, () =>
    HttpResponse.json(
      {
        code: 14001,
        message: "Customer not found.",
      },
      { status: 404 },
    ),
  ),
  http.get(`${FLINKS_BASE_PATH}/aggregation/v1/customers`, () => {
    return HttpResponse.json(customerData);
  }),
  http.post(FLINKS_HISTORIC_TRANSACTIONS_PATH, () => {
    return HttpResponse.json({});
  }),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v1/customers/testCustomerId/accounts`,
    () => HttpResponse.json(accountsData),
  ),
  http.get(
    `${FLINKS_INT_BASE_PATH}/aggregation/v1/customers/:userId/institutionLogins/:connectionId/accounts`,
    () => HttpResponse.json(accountsData),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v1/customers/:userId/institutionLogins/:connectionId/accounts`,
    () => HttpResponse.json(accountsData),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v3/customers/:userId/accounts/:accountId/owner`,
    () => HttpResponse.json(accountOwnerData),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v1/customers/:userId/accounts/:accountId/details`,
    () => HttpResponse.json(accountAchData),
  ),
  http.get(
    `${FLINKS_BASE_PATH}/aggregation/v4/customers/:customerId/accounts/:accountId/transactions`,
    () => HttpResponse.json(accountTransactionsData),
  ),
  http.post(`${FLINKS_BASE_PATH}/connect/v2/generate/lite`, () =>
    HttpResponse.json({ link: MOCKED_OAUTH_URL }),
  ),
  http.post(`${FLINKS_BASE_PATH}/connect/v2/generate/fix`, () =>
    HttpResponse.json({ link: MOCKED_FIX_OAUTH_URL }),
  ),
  http.post(CREATE_USER_PATH, async () => {
    return HttpResponse.json({ ...customerData, id: "createdNewCustomerId" });
  }),
  http.post(
    `${FLINKS_BASE_PATH}/aggregation/v2/customers/:customerId/accounts`,
    () => {
      return HttpResponse.json({ success: true });
    },
  ),
  http.delete(DELETE_USER_PATH, () => new HttpResponse(null, { status: 200 })),
];

export default handlers;
