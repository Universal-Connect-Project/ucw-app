import { http, HttpResponse } from 'msw'
import { BASE_PATH as MX_BASE_PATH } from '../server/serviceClients/mxClient/base'
import { institutionData, finicityInsitutionData } from './testData/institution'
import { institutionCredentialsData } from './testData/institutionCredentials'
import { aggregateMemberMemberData, connectionByIdMemberData, extendHistoryMemberData, identifyMemberData, memberData, membersData, memberStatusData, verifyMemberData } from './testData/members'
import { createUserData, listUsersData, createCustomerData } from './testData/users'

const FINICITY_BASE_PATH = 'https://api.finicity.com'

export const MX_INSTITUTION_BY_ID_PATH = `${MX_BASE_PATH}/institutions/:institutionId`
export const FINICITY_INSTITUTION_BY_ID_PATH = `${FINICITY_BASE_PATH}/institution/v2/institutions/:institutionId`
export const INSTITUTION_CREDENTIALS_BY_ID_PATH = `${MX_BASE_PATH}/institutions/:institutionId/credentials`
export const CONNECTIONS_BY_ID_PATH = `${MX_BASE_PATH}/users/:userId/members`
export const CONNECTION_CREDENTIALS_PATH = `${MX_BASE_PATH}/users/:userId/members/:memberId/credentials`
export const DELETE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:memberGuid`
export const CREATE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members`
export const VERIFY_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/verify`
export const IDENTIFY_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/identify`
export const EXTEND_HISTORY_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/extend_history`
export const DELETE_CONNECTION_PATH = `${MX_BASE_PATH}/users/:userId/managed_members/:id`
export const AGGREGATE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:id/aggregate`
export const UPDATE_CONNECTION_PATH = `${MX_BASE_PATH}/users/:userId/members/:id`
export const CONNECTION_BY_ID_PATH = `${MX_BASE_PATH}/users/:userId/members/:id`
export const READ_MEMBER_STATUS_PATH = `${MX_BASE_PATH}/users/:userId/members/:id/status`
export const ANSWER_CHALLENGE_PATH = `${MX_BASE_PATH}/users/:userId/members/:id/resume`
export const USERS_PATH = `${MX_BASE_PATH}/users`
export const CREATE_USER_PATH = `${MX_BASE_PATH}/users`
export const FINICITY_AUTH_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`
export const FINICITY_CONNECT_PATH = `${FINICITY_BASE_PATH}/connect/v2/generate/lite`
export const FINICITY_CONNECT_LITE_URL = 'https://testconnect.com'
export const DELETE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers/:id`
export const READ_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers?username=:id`
export const CREATE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/testing`

const handlers = [
  http.get(MX_INSTITUTION_BY_ID_PATH, () => HttpResponse.json(institutionData)),
  http.get(INSTITUTION_CREDENTIALS_BY_ID_PATH, () => HttpResponse.json(institutionCredentialsData)),
  http.get(CONNECTIONS_BY_ID_PATH, () => HttpResponse.json(membersData)),
  http.get(CONNECTION_CREDENTIALS_PATH, () => HttpResponse.json(institutionCredentialsData)),
  http.delete(DELETE_MEMBER_PATH, () => new HttpResponse(null, { status: 200 })),
  http.post(CREATE_MEMBER_PATH, () => HttpResponse.json(memberData)),
  http.post(VERIFY_MEMBER_PATH, () => HttpResponse.json(verifyMemberData)),
  http.post(IDENTIFY_MEMBER_PATH, () => HttpResponse.json(identifyMemberData)),
  http.post(EXTEND_HISTORY_PATH, () => HttpResponse.json(extendHistoryMemberData)),
  http.post(AGGREGATE_MEMBER_PATH, () => HttpResponse.json(aggregateMemberMemberData)),
  http.delete(DELETE_CONNECTION_PATH, () => new HttpResponse(null, { status: 200 })),
  http.put(UPDATE_CONNECTION_PATH, () => HttpResponse.json(memberData)),
  http.get(CONNECTION_BY_ID_PATH, () => HttpResponse.json(connectionByIdMemberData)),
  http.get(READ_MEMBER_STATUS_PATH, () => HttpResponse.json(memberStatusData)),
  http.put(ANSWER_CHALLENGE_PATH, () => new HttpResponse(null, { status: 200 })),
  http.get(USERS_PATH, () => HttpResponse.json(listUsersData)),
  http.post(CREATE_USER_PATH, () => HttpResponse.json(createUserData)),
  http.post(FINICITY_AUTH_PATH, () => HttpResponse.json({ token: 'testAuthToken' })),
  http.get(FINICITY_INSTITUTION_BY_ID_PATH, () => HttpResponse.json(finicityInsitutionData)),
  http.post(FINICITY_CONNECT_PATH, () => HttpResponse.json({ link: FINICITY_CONNECT_LITE_URL })),
  http.post(CREATE_CUSTOMER_PATH, () => HttpResponse.json(createCustomerData))
]

export default handlers
