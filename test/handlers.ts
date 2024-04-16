import { http, HttpResponse } from 'msw'
import { BASE_PATH as MX_BASE_PATH } from '../server/serviceClients/mxClient/base'
import { institutionData } from './testData/institution'
import { institutionCredentialsData } from './testData/institutionCredentials'
import { extendHistoryMemberData, identifyMemberData, memberData, membersData, verifyMemberData } from './testData/members'

export const INSTITUTION_BY_ID_PATH = `${MX_BASE_PATH}/institutions/:institutionId`
export const INSTITUTION_CREDENTIALS_BY_ID_PATH = `${MX_BASE_PATH}/institutions/:institutionId/credentials`
export const CONNECTIONS_BY_ID_PATH = `${MX_BASE_PATH}/users/:userId/members`
export const CONNECTION_CREDENTIALS_PATH = `${MX_BASE_PATH}/users/:userId/members/:memberId/credentials`
export const DELETE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:memberGuid`
export const CREATE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members`
export const VERIFY_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/verify`
export const IDENTIFY_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/identify`
export const EXTEND_HISTORY_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/extend_history`

const handlers = [
  http.get(INSTITUTION_BY_ID_PATH, () => HttpResponse.json(institutionData)),
  http.get(INSTITUTION_CREDENTIALS_BY_ID_PATH, () => HttpResponse.json(institutionCredentialsData)),
  http.get(CONNECTIONS_BY_ID_PATH, () => HttpResponse.json(membersData)),
  http.get(CONNECTION_CREDENTIALS_PATH, () => HttpResponse.json(institutionCredentialsData)),
  http.delete(DELETE_MEMBER_PATH, () => new HttpResponse(null, { status: 200 })),
  http.post(CREATE_MEMBER_PATH, () => HttpResponse.json(memberData)),
  http.post(VERIFY_MEMBER_PATH, () => HttpResponse.json(verifyMemberData)),
  http.post(IDENTIFY_MEMBER_PATH, () => HttpResponse.json(identifyMemberData)),
  http.post(EXTEND_HISTORY_PATH, () => HttpResponse.json(extendHistoryMemberData))
]

export default handlers
