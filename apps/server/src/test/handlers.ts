import { http, HttpResponse } from "msw";
import config from "../config";
import { accessTokenResponse } from "./testData/auth0";
import { finicityInsitutionData } from "./testData/institution";
import { createCustomerData } from "./testData/users";

const FINICITY_BASE_PATH = "https://api.finicity.com";
export const FINICITY_INSTITUTION_BY_ID_PATH = `${FINICITY_BASE_PATH}/institution/v2/institutions/:institutionId`;
export const CREATE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/testing`;
export const FINICITY_AUTH_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`;
export const FINICITY_CONNECT_PATH = `${FINICITY_BASE_PATH}/connect/v2/generate/lite`;
export const FINICITY_CONNECT_LITE_URL = "https://testconnect.com";

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
  http.post(config.AUTH0_TOKEN_URL, () =>
    HttpResponse.json(accessTokenResponse),
  ),
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
];

export default handlers;
