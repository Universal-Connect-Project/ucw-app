import { http, HttpResponse } from "msw";

import { MX_BASE_PATH_PROD, MX_BASE_PATH_INT } from "./consts";

import { institutionData } from "./testData/institution";

import { institutionCredentialsData } from "./testData/institutionCredentials";

import {
  connectionByIdMemberData,
  memberData,
  membersData,
  memberStatusData,
  oauthMemberdata,
} from "./testData/members";
import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData,
} from "./testData/mxVcData";
import { createUserData, listUsersData } from "./testData/users";

export const MX_INSTITUTION_BY_ID_PATH = `${MX_BASE_PATH_PROD}/institutions/:institutionId`;
export const MX_TEST_INSTITUTION_BY_ID_PATH = `${MX_BASE_PATH_INT}/institutions/:institutionId`;
export const INSTITUTION_CREDENTIALS_BY_ID_PATH = `${MX_BASE_PATH_PROD}/institutions/:institutionId/credentials`;
export const CONNECTIONS_BY_ID_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members`;
export const CONNECTION_CREDENTIALS_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members/:memberId/credentials`;
export const DELETE_MEMBER_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members/:memberGuid`;
export const CREATE_MEMBER_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members`;
export const LIST_MEMBERS_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members`;
export const DELETE_CONNECTION_PATH = `${MX_BASE_PATH_PROD}/users/:userId/managed_members/:id`;
export const MX_DELETE_USER_PATH = `${MX_BASE_PATH_PROD}/users/:userId`;
export const UPDATE_CONNECTION_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members/:id`;
export const CONNECTION_BY_ID_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members/:id`;
export const READ_MEMBER_STATUS_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members/:id/status`;
export const ANSWER_CHALLENGE_PATH = `${MX_BASE_PATH_PROD}/users/:userId/members/:id/resume`;
export const USERS_PATH = `${MX_BASE_PATH_PROD}/users`;
export const CREATE_USER_PATH = `${MX_BASE_PATH_PROD}/users`;
export const GET_OAUTH_REFRESH = `${MX_BASE_PATH_PROD}/users/:userId/members/:memberId/oauth_window_uri`;

export const MX_INTEGRATION_VC_GET_ACCOUNTS_PATH = `${MX_BASE_PATH_INT}/vc/users/:userId/members/:connectionId/accounts`;
export const MX_VC_GET_ACCOUNTS_PATH = `${MX_BASE_PATH_PROD}/vc/users/:userId/members/:connectionId/accounts`;
export const MX_VC_GET_IDENTITY_PATH = `${MX_BASE_PATH_PROD}/vc/users/:userId/members/:connectionId/customers`;
export const MX_VC_GET_TRANSACTIONS_PATH = `${MX_BASE_PATH_PROD}/vc/users/:userId/accounts/:accountId/transactions`;

export const mxHandlers = [
  http.get(MX_VC_GET_TRANSACTIONS_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcTranscationsData }),
  ),
  http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcIntegrationAccountsData }),
  ),
  http.get(MX_VC_GET_ACCOUNTS_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcAccountsData }),
  ),
  http.get(MX_VC_GET_IDENTITY_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcIdentityData }),
  ),
  http.get(MX_INSTITUTION_BY_ID_PATH, () => HttpResponse.json(institutionData)),
  http.get(MX_TEST_INSTITUTION_BY_ID_PATH, () =>
    HttpResponse.json(institutionData),
  ),
  http.get(INSTITUTION_CREDENTIALS_BY_ID_PATH, () =>
    HttpResponse.json(institutionCredentialsData),
  ),
  http.get(CONNECTIONS_BY_ID_PATH, () => HttpResponse.json(membersData)),
  http.get(CONNECTION_CREDENTIALS_PATH, () =>
    HttpResponse.json(institutionCredentialsData),
  ),
  http.delete(
    DELETE_MEMBER_PATH,
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.post(CREATE_MEMBER_PATH, () => HttpResponse.json(memberData)),
  http.delete(
    DELETE_CONNECTION_PATH,
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.delete(
    MX_DELETE_USER_PATH,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.put(UPDATE_CONNECTION_PATH, () => HttpResponse.json(memberData)),
  http.get(CONNECTION_BY_ID_PATH, () =>
    HttpResponse.json(connectionByIdMemberData),
  ),
  http.get(READ_MEMBER_STATUS_PATH, () => HttpResponse.json(memberStatusData)),
  http.get(GET_OAUTH_REFRESH, () => HttpResponse.json(oauthMemberdata)),
  http.put(
    ANSWER_CHALLENGE_PATH,
    () => new HttpResponse(null, { status: 200 }),
  ),
  http.get(USERS_PATH, () => HttpResponse.json(listUsersData)),
  http.post(CREATE_USER_PATH, () => HttpResponse.json(createUserData)),
];
