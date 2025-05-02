import { http, HttpResponse } from "msw";

import { BASE_PATH as FINICITY_BASE_PATH } from "../apiClient";

import { customerData } from "./testData/users";
import {
  accountsData,
  accountTransactionsData,
  accountOwnerData,
  accountAchData,
} from "./testData/accounts";
const FINICITY_INT_BASE_PATH = "https://int-api.finicity.com";

export const CREATE_USER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/active`;
export const DELETE_USER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers/:customerId`;
export const MOCKED_OAUTH_URL = "http://example.url";

const handlers = [
  http.post(
    `${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`,
    () => HttpResponse.json({ token: "mocked-token" }),
  ),
  http.post(
    `${FINICITY_INT_BASE_PATH}/aggregation/v2/partners/authentication`,
    () => HttpResponse.json({ token: "mocked-int-token" }),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/institution/v2/institutions/nonExistingId`,
    () => HttpResponse.json({}),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v1/customers/:customerId/accounts/:accountId/details`,
    () => HttpResponse.json(accountAchData),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v1/customers/${customerData.customers[0].id}`,
    () => HttpResponse.json(customerData.customers[0]),
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers/:customerId`, () =>
    HttpResponse.json(
      {
        code: 14001,
        message: "Customer not found.",
      },
      { status: 404 },
    ),
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers`, ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");
    switch (username) {
      case "test-user-name":
        return HttpResponse.json(customerData);
      case "nonExistingUserId":
      default:
        return HttpResponse.json({ customers: [] });
    }
  }),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v1/customers/testCustomerId/accounts`,
    () => HttpResponse.json(accountsData),
  ),
  http.get(
    `${FINICITY_INT_BASE_PATH}/aggregation/v1/customers/userId/institutionLogins/connectionId/accounts`,
    () => HttpResponse.json(accountsData),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v1/customers/userId/institutionLogins/connectionId/accounts`,
    () => HttpResponse.json(accountsData),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v3/customers/userId/accounts/accountId/owner`,
    () => HttpResponse.json(accountOwnerData),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v1/customers/userId/accounts/accountId/details`,
    () => HttpResponse.json(accountAchData),
  ),
  http.get(
    `${FINICITY_BASE_PATH}/aggregation/v4/customers/:customerId/accounts/:accountId/transactions`,
    () => HttpResponse.json(accountTransactionsData),
  ),
  http.post(`${FINICITY_BASE_PATH}/connect/v2/generate/lite`, () =>
    HttpResponse.json({ link: MOCKED_OAUTH_URL }),
  ),
  http.post(`${FINICITY_BASE_PATH}/connect/v2/generate/fix`, () =>
    HttpResponse.json({ link: MOCKED_OAUTH_URL }),
  ),
  http.post(CREATE_USER_PATH, async ({ request }) => {
    const body = (await request.json()) as { username: string };
    if (body.username === "invalid-user") {
      return HttpResponse.json({ error: "Failed" }, { status: 400 });
    }
    return HttpResponse.json({ ...customerData, id: "createdNewCustomerId" });
  }),
  http.post(
    `${FINICITY_BASE_PATH}/aggregation/v2/customers/:customerId/accounts`,
    ({ params }) => {
      const { customerId } = params;

      if (customerId === "testCustomerId") {
        return HttpResponse.json({ success: true });
      }

      return HttpResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    },
  ),
  http.delete(DELETE_USER_PATH, () => new HttpResponse(null, { status: 200 })),
];

export default handlers;
