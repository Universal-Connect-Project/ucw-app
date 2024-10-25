import { http, HttpResponse } from "msw";
import config from "../config";
import { accessTokenResponse } from "./testData/auth0";
import {
  finicityInsitutionData,
  sophtronInstitutionData,
  sophtronUserInstitutionAccountsData,
} from "./testData/institution";
import {
  createCustomerData as createSophtronCustomerData,
  customerFromUniqueIdData,
} from "./testData/sophtronCustomer";
import {
  createMemberData,
  getMemberData,
  updateMemberData,
} from "./testData/sophtronMember";
import {
  sophtronVcAccountsData,
  sophtronVcIdentityData,
  sophtronVcTranscationsData,
} from "./testData/sophtronVcData";
import { createCustomerData } from "./testData/users";

const FINICITY_BASE_PATH = "https://api.finicity.com";
export const FINICITY_INSTITUTION_BY_ID_PATH = `${FINICITY_BASE_PATH}/institution/v2/institutions/:institutionId`;
export const DELETE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers/:id`;
export const READ_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers`;
export const CREATE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/testing`;
export const FINICITY_AUTH_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`;
export const FINICITY_CONNECT_PATH = `${FINICITY_BASE_PATH}/connect/v2/generate/lite`;
export const FINICITY_CONNECT_LITE_URL = "https://testconnect.com";

const SOPHTRON_V2_BASE_PATH = "https://api.sophtron.com/api/v2";
const SOPHTRON_V1_BASE_PATH = "https://api.sophtron.com/api";

export const SOPHTRON_DELETE_MEMBER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId/members/:memberId`;
export const SOPHTRON_DELETE_USER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId`;
export const SOPHTRON_INSTITUTION_BY_ID_PATH = `${SOPHTRON_V1_BASE_PATH}/Institution/GetInstitutionByID`;
export const SOPHTRON_MEMBER_BY_ID_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId/members/:memberId`;
export const SOPHTRON_CREATE_MEMBER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId/members/:jobType`;
export const SOPHTRON_UPDATE_MEMBER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:customerId/members/:memberId/:jobType`;
export const SOPHTRON_GET_JOB_INFO_PATH = `${SOPHTRON_V2_BASE_PATH}/job/:jobId`;
export const SOPHTRON_GET_USER_INSTITUTION_ACCOUNTS_PATH = `${SOPHTRON_V1_BASE_PATH}/UserInstitution/GetUserInstitutionAccounts`;
export const SOPHTRON_ANSWER_JOB_MFA_PATH = `${SOPHTRON_V2_BASE_PATH}/job/:jobId/challenge/:challengeId`;
export const SOPHTRON_CUSTOMER_UNIQUE_ID_PATH = `${SOPHTRON_V2_BASE_PATH}/customers`;
export const SOPHTRON_CREATE_CUSTOMER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers`;
export const SOPHTRON_GET_USER_INTEGRATION_KEY_PATH = `${SOPHTRON_V1_BASE_PATH}/User/GetUserIntegrationKey`;

export const SOPHTRON_VC_BASE_PATH = "https://vc.sophtron.com/api/vc";

export const SOPHTRON_VC_GET_IDENTITY_PATH = `${SOPHTRON_VC_BASE_PATH}/customers/:userId/members/:connectionId/identity`;
export const SOPHTRON_VC_GET_ACCOUNTS_PATH = `${SOPHTRON_VC_BASE_PATH}/customers/:userId/members/:connectionId/accounts`;
export const SOPHTRON_VC_GET_TRANSACTIONS_PATH = `${SOPHTRON_VC_BASE_PATH}/customers/:userId/accounts/:accountId/transactions`;

const handlers = [
  http.get(SOPHTRON_VC_GET_TRANSACTIONS_PATH, () =>
    HttpResponse.json({ vc: sophtronVcTranscationsData }),
  ),
  http.get(SOPHTRON_VC_GET_ACCOUNTS_PATH, () =>
    HttpResponse.json({ vc: sophtronVcAccountsData }),
  ),
  http.get(SOPHTRON_VC_GET_IDENTITY_PATH, () =>
    HttpResponse.json({ vc: sophtronVcIdentityData }),
  ),
  http.post(SOPHTRON_GET_USER_INTEGRATION_KEY_PATH, () =>
    HttpResponse.json({ IntegrationKey: "testIntegrationKey" }),
  ),
  http.post(SOPHTRON_CUSTOMER_UNIQUE_ID_PATH, () =>
    HttpResponse.json(createSophtronCustomerData),
  ),
  http.get(SOPHTRON_CUSTOMER_UNIQUE_ID_PATH, () =>
    HttpResponse.json([customerFromUniqueIdData]),
  ),
  http.put(
    SOPHTRON_ANSWER_JOB_MFA_PATH,
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.post(SOPHTRON_GET_USER_INSTITUTION_ACCOUNTS_PATH, () =>
    HttpResponse.json(sophtronUserInstitutionAccountsData),
  ),
  http.get(SOPHTRON_GET_JOB_INFO_PATH, () => HttpResponse.json({})),
  http.put(SOPHTRON_UPDATE_MEMBER_PATH, () =>
    HttpResponse.json(updateMemberData),
  ),
  http.post(SOPHTRON_CREATE_MEMBER_PATH, () =>
    HttpResponse.json(createMemberData),
  ),
  http.post(SOPHTRON_INSTITUTION_BY_ID_PATH, () =>
    HttpResponse.json(sophtronInstitutionData),
  ),
  http.get(SOPHTRON_MEMBER_BY_ID_PATH, () => HttpResponse.json(getMemberData)),
  http.delete(
    SOPHTRON_DELETE_MEMBER_PATH,
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.delete(
    SOPHTRON_DELETE_USER_PATH,
    () => new HttpResponse(null, { status: 200 }),
  ),
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
  http.post(config.Auth0TokenUrl, () => HttpResponse.json(accessTokenResponse)),
];

export default handlers;
