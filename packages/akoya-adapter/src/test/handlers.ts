import { http, HttpResponse } from 'msw'

import { 
  AKOYA_BASE_PATH,
  AKOYA_BASE_PROD_PATH,
  AKOYA_PRODUCT_PATH,
  AKOYA_PRODUCT_PROD_PATH,
} from '../apiClient'

import { paymentData } from './testData/payments';
import { accountsData } from "./testData/accounts";
import { balanceData } from './testData/balances';
import { investmentData } from './testData/investments';
import { tokenData } from './testData/token';
import { transactionData } from './testData/transactions';
import { customerData } from './testData/customer';

const handlers = [
  http.post(`${AKOYA_BASE_PATH}/token`, () =>
    HttpResponse.json(tokenData)
  ),
  http.post(`${AKOYA_BASE_PROD_PATH}/token`, () =>
    HttpResponse.json(tokenData)
  ),
  http.get(`${AKOYA_PRODUCT_PATH}/accounts-info/v2/mikomo`, () =>{
      return HttpResponse.json(accountsData);
  }),
  http.get(`${AKOYA_PRODUCT_PROD_PATH}/accounts-info/v2/mikomo`, () =>{
      return HttpResponse.json(accountsData);
  }),
  http.get(`${AKOYA_PRODUCT_PATH}/balances/v2/mikomo`, ({request}) =>{
    const url = new URL(request.url)
    const accountIds = url.searchParams.get('accountIds')
    switch(accountIds){
      case "accountId":
        return HttpResponse.json(balanceData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({accounts: []});
    }
  }),
  http.get(`${AKOYA_PRODUCT_PROD_PATH}/balances/v2/mikomo`, ({request}) =>{
    const url = new URL(request.url)
    const accountIds = url.searchParams.get('accountIds')
    switch(accountIds){
      case "accountId":
        return HttpResponse.json(balanceData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({accounts: []});
    }
  }),
  http.get(`${AKOYA_PRODUCT_PATH}/accounts/v2/mikomo`, ({request}) =>{
    const url = new URL(request.url)
    const accountIds = url.searchParams.get('accountIds')
    switch(accountIds){
      case "accountId":
        return HttpResponse.json(investmentData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({accounts: []});
    }
  }),
  http.get(`${AKOYA_PRODUCT_PROD_PATH}/accounts/v2/mikomo`, ({request}) =>{
    const url = new URL(request.url)
    const accountIds = url.searchParams.get('accountIds')
    switch(accountIds){
      case "accountId":
        return HttpResponse.json(investmentData)
      case "nonExistingUserId":
      default:
        return HttpResponse.json({accounts: []});
    }
  }),
  http.get(`${AKOYA_PRODUCT_PATH}/payments/v2/mikomo/accountId/payment-networks`, () => {
    return HttpResponse.json(paymentData)
  }),
  http.get(`${AKOYA_PRODUCT_PROD_PATH}/payments/v2/mikomo/accountId/payment-networks`, () => {
    return HttpResponse.json(paymentData)
  }),
  http.get(`${AKOYA_PRODUCT_PATH}/transactions/v2/mikomo/839502593`, () => {
    return HttpResponse.json(transactionData)
  }),
  http.get(`${AKOYA_PRODUCT_PROD_PATH}/transactions/v2/mikomo/839502593`, () => {
    return HttpResponse.json(transactionData)
  }),
  http.get(`${AKOYA_PRODUCT_PATH}/customers/v2/mikomo/current`, () => {
    return HttpResponse.json(customerData)
  }),
  http.get(`${AKOYA_PRODUCT_PROD_PATH}/customers/v2/mikomo/current`, () => {
    return HttpResponse.json(customerData)
  })
]

export default handlers
