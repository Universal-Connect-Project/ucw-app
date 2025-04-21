import { http, HttpResponse } from 'msw'

import { BASE_PATH as FINICITY_BASE_PATH } from '../apiClient'

import {
  institutionsData,
  institutionDetailData,
} from './testData/institutions'
import { 
  customerData 
} from "./testData/users";
import { 
  accountsData, 
  accountTransactionsData, 
  accountOwnerData,
  accountAchData,
} from "./testData/accounts";
const FINICITY_INT_BASE_PATH = 'https://int-api.finicity.com'

export const CREATE_USER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/active`
export const DELETE_NEW_USER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/createdNewCustomerId`
export const DELETE_USER_PATH = `${FINICITY_BASE_PATH}/aggregation/v2/customers/testCustomerId`

const handlers = [

  http.post(`${FINICITY_BASE_PATH}/aggregation/v2/partners/authentication`, () =>
    HttpResponse.json({ token: 'mocked-token' })
  ),
  http.post(`${FINICITY_INT_BASE_PATH}/aggregation/v2/partners/authentication`, () =>
    HttpResponse.json({ token: 'mocked-int-token' })
  ),
  http.get(`${FINICITY_BASE_PATH}/institution/v2/institutions`, () =>
    HttpResponse.json(institutionsData)
  ),
  http.get(`${FINICITY_INT_BASE_PATH}/institution/v2/institutions/testId`, () =>
    HttpResponse.json(institutionDetailData)
  ),
  http.get(`${FINICITY_BASE_PATH}/institution/v2/institutions/testId`, () =>
    HttpResponse.json(institutionDetailData)
  ),
  http.get(`${FINICITY_BASE_PATH}/institution/v2/institutions/nonExistingId`, () =>
    HttpResponse.json({})
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers/testCustomerId`, () =>
    HttpResponse.json(customerData)
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers`, ({request}) =>
  {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    switch(username){
      case "test-user-name":
        return HttpResponse.json(customerData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({customers: []});
    }
  }),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers/testCustomerId/accounts`, () =>
    HttpResponse.json(accountsData)
  ),
  http.get(`${FINICITY_INT_BASE_PATH}/aggregation/v1/customers/userId/institutionLogins/connectionId/accounts`, () =>
    HttpResponse.json(accountsData)
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers/userId/institutionLogins/connectionId/accounts`, () =>
    HttpResponse.json(accountsData)
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v3/customers/userId/accounts/accountId/owner`, () =>
    HttpResponse.json(accountOwnerData)
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v1/customers/userId/accounts/accountId/details`, () =>
    HttpResponse.json(accountAchData)
  ),
  http.get(`${FINICITY_BASE_PATH}/aggregation/v4/customers/userId/accounts/accountId/transactions`, () =>
    HttpResponse.json(accountTransactionsData)
  ),
  http.post(`${FINICITY_BASE_PATH}/connect/v2/generate/lite`, () =>
    HttpResponse.json({ link: 'http://example.url' })
  ),
  http.post(`${FINICITY_BASE_PATH}/connect/v2/generate/fix`, () =>
    HttpResponse.json({ link: 'http://example.url' })
  ),
  http.post(CREATE_USER_PATH, () =>
    HttpResponse.json({...customerData, id: 'createdNewCustomerId'})
  ),

  http.delete(
    DELETE_USER_PATH,
    () => new HttpResponse(null, { status: 200 })
  ),
]

export default handlers
