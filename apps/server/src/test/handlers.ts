import { http, HttpResponse } from "msw";
import config from "../config";
import { finicityInsitutionData } from "./testData/institution";
import { createCustomerData } from "./testData/users";
import { m2mAccessTokenResponse } from "../shared/utils/test/testData/m2mAccessToken";

const FINICITY_BASE_PATH = "https://api.finicity.com";
export const FINICITY_INSTITUTION_BY_ID_PATH = `${FINICITY_BASE_PATH}/institution/v2/institutions/:institutionId`;
export const CREATE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/testing`;
export const FINICITY_AUTH_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`;
export const FINICITY_CONNECT_PATH = `${FINICITY_BASE_PATH}/connect/v2/generate/lite`;
export const FINICITY_CONNECT_LITE_URL = "https://testconnect.com";
export const FETCH_ACCESS_TOKEN_URL = `https://${config.UCP_AUTH0_DOMAIN}/oauth/token`;

const handlers = [
  http.post(FINICITY_AUTH_PATH, () =>
    HttpResponse.json({ token: "testAuthToken" }),
  ),
  http.get(FINICITY_INSTITUTION_BY_ID_PATH, () =>
    HttpResponse.json(finicityInsitutionData),
  ),
  http.post(FINICITY_CONNECT_PATH, () =>
    HttpResponse.json({ link: FINICITY_CONNECT_LITE_URL }),
  ),
  http.post(CREATE_CUSTOMER_PATH, () => HttpResponse.json(createCustomerData)),
  http.put(
    `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
    () => HttpResponse.json({}),
  ),
  http.put(
    `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionPause`,
    () => HttpResponse.json({}),
  ),
  http.put(
    `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionResume`,
    () => HttpResponse.json({}),
  ),
  http.post(
    `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionStart`,
    () => HttpResponse.json({}),
  ),
  http.post(FETCH_ACCESS_TOKEN_URL, () =>
    HttpResponse.json(m2mAccessTokenResponse),
  ),
];

export default handlers;
