import { http, HttpResponse } from 'msw'
import config from '../config'
import { BASE_PATH as MX_BASE_PATH } from '../aggregatorApiClients/mx'
import { accessTokenResponse } from './testData/auth0'
import {
  finicityInsitutionData,
  institutionData,
  sophtronInstitutionData,
  sophtronUserInstitutionAccountsData
} from './testData/institution'
import { institutionCredentialsData } from './testData/institutionCredentials'
import {
  aggregateMemberMemberData,
  connectionByIdMemberData,
  extendHistoryMemberData,
  identifyMemberData,
  memberData,
  membersData,
  memberStatusData,
  verifyMemberData
} from './testData/members'
import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData
} from './testData/mxVcData'
import {
  createCustomerData as createSophtronCustomerData,
  customerFromUniqueIdData
} from './testData/sophtronCustomer'
import {
  createMemberData,
  getMemberData,
  updateMemberData
} from './testData/sophtronMember'
import {
  sophtronVcAccountsData,
  sophtronVcIdentityData,
  sophtronVcTranscationsData
} from './testData/sophtronVcData'
import {
  createCustomerData,
  createUserData,
  listUsersData
} from './testData/users'

const MX_INTEGRATION_PATH = 'https://int-api.mx.com'

export const MX_INSTITUTION_BY_ID_PATH = `${MX_BASE_PATH}/institutions/:institutionId`
export const MX_TEST_INSTITUTION_BY_ID_PATH = `${MX_INTEGRATION_PATH}/institutions/:institutionId`
export const INSTITUTION_CREDENTIALS_BY_ID_PATH = `${MX_BASE_PATH}/institutions/:institutionId/credentials`
export const CONNECTIONS_BY_ID_PATH = `${MX_BASE_PATH}/users/:userId/members`
export const CONNECTION_CREDENTIALS_PATH = `${MX_BASE_PATH}/users/:userId/members/:memberId/credentials`
export const DELETE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:memberGuid`
export const CREATE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members`
export const VERIFY_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/verify`
export const IDENTIFY_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/identify`
export const EXTEND_HISTORY_PATH = `${MX_BASE_PATH}/users/:userId/members/:guid/extend_history`
export const DELETE_CONNECTION_PATH = `${MX_BASE_PATH}/users/:userId/managed_members/:id`
export const MX_DELETE_USER_PATH = `${MX_BASE_PATH}/users/:userId`
export const AGGREGATE_MEMBER_PATH = `${MX_BASE_PATH}/users/:userId/members/:id/aggregate`
export const UPDATE_CONNECTION_PATH = `${MX_BASE_PATH}/users/:userId/members/:id`
export const CONNECTION_BY_ID_PATH = `${MX_BASE_PATH}/users/:userId/members/:id`
export const READ_MEMBER_STATUS_PATH = `${MX_BASE_PATH}/users/:userId/members/:id/status`
export const ANSWER_CHALLENGE_PATH = `${MX_BASE_PATH}/users/:userId/members/:id/resume`
export const USERS_PATH = `${MX_BASE_PATH}/users`
export const CREATE_USER_PATH = `${MX_BASE_PATH}/users`

export const MX_INTEGRATION_VC_GET_ACCOUNTS_PATH = `${MX_INTEGRATION_PATH}/vc/users/:userId/members/:connectionId/accounts`
export const MX_VC_GET_ACCOUNTS_PATH = `${MX_BASE_PATH}/vc/users/:userId/members/:connectionId/accounts`
export const MX_VC_GET_IDENTITY_PATH = `${MX_BASE_PATH}/vc/users/:userId/members/:connectionId/customers`
export const MX_VC_GET_TRANSACTIONS_PATH = `${MX_BASE_PATH}/vc/users/:userId/accounts/:accountId/transactions`

const FINICITY_BASE_PATH = 'https://api.finicity.com'
export const FINICITY_INSTITUTION_BY_ID_PATH = `${FINICITY_BASE_PATH}/institution/v2/institutions/:institutionId`
export const DELETE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers/:id`
export const READ_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v1/customers`
export const CREATE_CUSTOMER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/testing`
export const FINICITY_AUTH_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`
export const FINICITY_CONNECT_PATH = `${FINICITY_BASE_PATH}/connect/v2/generate/lite`
export const FINICITY_CONNECT_LITE_URL = 'https://testconnect.com'

const SOPHTRON_V2_BASE_PATH = 'https://api.sophtron.com/api/v2'
const SOPHTRON_V1_BASE_PATH = 'https://api.sophtron.com/api'

export const SOPHTRON_DELETE_MEMBER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId/members/:memberId`
export const SOPHTRON_DELETE_USER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId`
export const SOPHTRON_INSTITUTION_BY_ID_PATH = `${SOPHTRON_V1_BASE_PATH}/Institution/GetInstitutionByID`
export const SOPHTRON_MEMBER_BY_ID_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId/members/:memberId`
export const SOPHTRON_CREATE_MEMBER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:userId/members/:jobType`
export const SOPHTRON_UPDATE_MEMBER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers/:customerId/members/:memberId/:jobType`
export const SOPHTRON_GET_JOB_INFO_PATH = `${SOPHTRON_V2_BASE_PATH}/job/:jobId`
export const SOPHTRON_GET_USER_INSTITUTION_ACCOUNTS_PATH = `${SOPHTRON_V1_BASE_PATH}/UserInstitution/GetUserInstitutionAccounts`
export const SOPHTRON_ANSWER_JOB_MFA_PATH = `${SOPHTRON_V2_BASE_PATH}/job/:jobId/challenge/:challengeId`
export const SOPHTRON_CUSTOMER_UNIQUE_ID_PATH = `${SOPHTRON_V2_BASE_PATH}/customers`
export const SOPHTRON_CREATE_CUSTOMER_PATH = `${SOPHTRON_V2_BASE_PATH}/customers`
export const SOPHTRON_GET_USER_INTEGRATION_KEY_PATH = `${SOPHTRON_V1_BASE_PATH}/User/GetUserIntegrationKey`

export const SOPHTRON_VC_BASE_PATH = 'https://vc.sophtron.com/api/vc'

export const SOPHTRON_VC_GET_IDENTITY_PATH = `${SOPHTRON_VC_BASE_PATH}/customers/:userId/members/:connectionId/identity`
export const SOPHTRON_VC_GET_ACCOUNTS_PATH = `${SOPHTRON_VC_BASE_PATH}/customers/:userId/members/:connectionId/accounts`
export const SOPHTRON_VC_GET_TRANSACTIONS_PATH = `${SOPHTRON_VC_BASE_PATH}/customers/:userId/accounts/:accountId/transactions`

const handlers = [
  http.get(SOPHTRON_VC_GET_TRANSACTIONS_PATH, () =>
    HttpResponse.json({ vc: sophtronVcTranscationsData })
  ),
  http.get(SOPHTRON_VC_GET_ACCOUNTS_PATH, () =>
    HttpResponse.json({ vc: sophtronVcAccountsData })
  ),
  http.get(SOPHTRON_VC_GET_IDENTITY_PATH, () =>
    HttpResponse.json({ vc: sophtronVcIdentityData })
  ),
  http.post(SOPHTRON_GET_USER_INTEGRATION_KEY_PATH, () =>
    HttpResponse.json({ IntegrationKey: 'testIntegrationKey' })
  ),
  http.get(MX_VC_GET_TRANSACTIONS_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcTranscationsData })
  ),
  http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcIntegrationAccountsData })
  ),
  http.get(MX_VC_GET_ACCOUNTS_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcAccountsData })
  ),
  http.get(MX_VC_GET_IDENTITY_PATH, () =>
    HttpResponse.json({ verifiableCredential: mxVcIdentityData })
  ),
  http.post(SOPHTRON_CUSTOMER_UNIQUE_ID_PATH, () =>
    HttpResponse.json(createSophtronCustomerData)
  ),
  http.get(SOPHTRON_CUSTOMER_UNIQUE_ID_PATH, () =>
    HttpResponse.json([customerFromUniqueIdData])
  ),
  http.put(
    SOPHTRON_ANSWER_JOB_MFA_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
  http.post(SOPHTRON_GET_USER_INSTITUTION_ACCOUNTS_PATH, () =>
    HttpResponse.json(sophtronUserInstitutionAccountsData)
  ),
  http.get(SOPHTRON_GET_JOB_INFO_PATH, () => HttpResponse.json({})),
  http.put(SOPHTRON_UPDATE_MEMBER_PATH, () =>
    HttpResponse.json(updateMemberData)
  ),
  http.post(SOPHTRON_CREATE_MEMBER_PATH, () =>
    HttpResponse.json(createMemberData)
  ),
  http.post(SOPHTRON_INSTITUTION_BY_ID_PATH, () =>
    HttpResponse.json(sophtronInstitutionData)
  ),
  http.get(SOPHTRON_MEMBER_BY_ID_PATH, () => HttpResponse.json(getMemberData)),
  http.delete(
    SOPHTRON_DELETE_MEMBER_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
  http.delete(
    SOPHTRON_DELETE_USER_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
  http.get(MX_INSTITUTION_BY_ID_PATH, () => HttpResponse.json(institutionData)),
  http.get(MX_TEST_INSTITUTION_BY_ID_PATH, () =>
    HttpResponse.json(institutionData)
  ),
  http.get(INSTITUTION_CREDENTIALS_BY_ID_PATH, () =>
    HttpResponse.json(institutionCredentialsData)
  ),
  http.get(CONNECTIONS_BY_ID_PATH, () => HttpResponse.json(membersData)),
  http.get(CONNECTION_CREDENTIALS_PATH, () =>
    HttpResponse.json(institutionCredentialsData)
  ),
  http.delete(
    DELETE_MEMBER_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
  http.post(CREATE_MEMBER_PATH, () => HttpResponse.json(memberData)),
  http.post(VERIFY_MEMBER_PATH, () => HttpResponse.json(verifyMemberData)),
  http.post(IDENTIFY_MEMBER_PATH, () => HttpResponse.json(identifyMemberData)),
  http.post(EXTEND_HISTORY_PATH, () =>
    HttpResponse.json(extendHistoryMemberData)
  ),
  http.post(AGGREGATE_MEMBER_PATH, () =>
    HttpResponse.json(aggregateMemberMemberData)
  ),
  http.delete(
    DELETE_CONNECTION_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
  http.delete(
    MX_DELETE_USER_PATH,
    () => new HttpResponse(null, { status: 204 })
  ),
  http.put(UPDATE_CONNECTION_PATH, () => HttpResponse.json(memberData)),
  http.get(CONNECTION_BY_ID_PATH, () =>
    HttpResponse.json(connectionByIdMemberData)
  ),
  http.get(READ_MEMBER_STATUS_PATH, () => HttpResponse.json(memberStatusData)),
  http.put(
    ANSWER_CHALLENGE_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
  http.get(USERS_PATH, () => HttpResponse.json(listUsersData)),
  http.post(CREATE_USER_PATH, () => HttpResponse.json(createUserData)),
  http.post(FINICITY_AUTH_PATH, () =>
    HttpResponse.json({ token: 'testAuthToken' })
  ),
  http.get(FINICITY_INSTITUTION_BY_ID_PATH, () =>
    HttpResponse.json(finicityInsitutionData)
  ),
  http.post(FINICITY_CONNECT_PATH, () =>
    HttpResponse.json({ link: FINICITY_CONNECT_LITE_URL })
  ),
  http.post(CREATE_CUSTOMER_PATH, () => HttpResponse.json(createCustomerData)),
  http.post(config.Auth0TokenUrl, () => HttpResponse.json(accessTokenResponse))
]

export default handlers
