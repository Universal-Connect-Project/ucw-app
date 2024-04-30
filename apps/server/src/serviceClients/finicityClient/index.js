import config from '../../config'
import { error } from '../../infra/logger'
import { create, post } from 'axios'

function makeFinicityAuthHeaders (apiConfig, tokenRes) {
  return {
    'Finicity-App-Key': apiConfig.appKey,
    'Finicity-App-Token': tokenRes.token,
    'Content-Type': 'application/json',
    accept: 'application/json'
  }
}

export default class FinicityClient {
  constructor (apiConfig) {
    this.apiConfig = apiConfig
  }

  getAuthToken () {
    return post(this.apiConfig.basePath + '/aggregation/v2/partners/authentication', {
      partnerId: this.apiConfig.partnerId,
      partnerSecret: this.apiConfig.secret
    }, {
      headers: {
        'Finicity-App-Key': this.apiConfig.appKey,
        'Content-Type': 'application/json'
      }
    }).then(res => res.data).catch(err => {
      error('Error at finicityClient.getAuthToken', err?.response?.data)
    })
  }

  async getInstitutions () {
    return await this.get('institution/v2/institutions')
  }

  async getInstitution (institutionId) {
    return await this.get(`institution/v2/institutions/${institutionId}`)
  }

  async getCustomers () {
    return await this.get('aggregation/v1/customers')
  }

  async getCustomer (uniqueName) {
    return await this.get(`aggregation/v1/customers?username=${uniqueName}`)
      .then(ret => ret.customers?.[0])
  }

  async getCustomerAccounts (customerId) {
    return await this.get(`aggregation/v1/customers/${customerId}/accounts`)
  }

  async getCustomerAccountsByInstitutionLoginId (customerId, institutionLoginId) {
    return await this.get(`aggregation/v1/customers/${customerId}/institutionLogins/${institutionLoginId}/accounts`)
      .then(res => res.accounts)
  }

  async getAccountOwnerDetail (customerId, accountId) {
    return await this.get(`aggregation/v3/customers/${customerId}/accounts/${accountId}/owner`)
      .then(res => res.holders?.[0])
  }

  async getAccountAchDetail (customerId, accountId) {
    // {
    //   "routingNumber": "123456789",
    //   "realAccountNumber": 2345678901
    // }
    return await this.get(`aggregation/v1/customers/${customerId}/accounts/${accountId}/details`)
  }

  async getTransactions (customerId, accountId, fromDate, toDate) {
    return await this.get(`aggregation/v4/customers/${customerId}/accounts/${accountId}/transactions`,
      {
        fromDate: Date.parse(fromDate) / 1000,
        toDate: Date.parse(toDate) / 1000,
        limit: 2
      }
    )
  }

  async generateConnectLiteUrl (institutionId, customerId, requestId) {
    return await this.post('connect/v2/generate/lite', {
      language: 'en-US',
      partnerId: this.apiConfig.partnerId,
      customerId,
      institutionId,
      redirectUri: `${config.HostUrl}/oauth/${this.apiConfig.provider}/redirect_from?connection_id=${requestId}`,
      webhook: `${config.WebhookHostUrl}/webhook/${this.apiConfig.provider}/?connection_id=${requestId}`,
      webhookContentType: 'application/json'
      // 'singleUseUrl': true,
      // 'experience': 'default',
    }).then(ret => ret.link)
  }

  async generateConnectFixUrl (institutionLoginId, customerId, requestId) {
    return await this.post('connect/v2/generate/fix', {
      language: 'en-US',
      partnerId: this.apiConfig.partnerId,
      customerId,
      institutionLoginId,
      redirectUri: `${config.HostUrl}/oauth/${this.apiConfig.provider}/redirect_from?connection_id=${requestId}`,
      webhook: `${config.WebhookHostUrl}/webhook/${this.apiConfig.provider}/?connection_id=${requestId}`,
      webhookContentType: 'application/json'
    }).then(ret => ret.link)
  }

  async createCustomer (uniqueName) {
    return await this.post(`aggregation/v2/customers/${this.apiConfig.provider === 'finicity_sandbox' ? 'testing' : 'active'}`, {
      username: uniqueName,
      firstName: 'John',
      lastName: 'Smith',
      // applicationId: '123456789',
      phone: '1-801-984-4200',
      email: 'myname@mycompany.com'
    })
  }

  async post (path, body) {
    return await this.request('post', path, null, body)
  }

  async get (path, params) {
    return await this.request('get', path, params)
  }

  async del (path, params) {
    return await this.request('delete', path, params)
  }

  async request (method, url, params, data) {
    if (this.axios == null) {
      const token = await this.getAuthToken()
      const headers = makeFinicityAuthHeaders(this.apiConfig, token)
      this.axios = create({
        baseURL: this.apiConfig.basePath,
        headers
      })
    }
    const ret = await this.axios.request({
      url,
      method,
      params,
      data
    })
      .then(res => res.data)
      .catch(err => {
        const newErr = new Error(`Error at finicityClient.${method} ${url}`, err?.response?.data)
        throw newErr
      })
    return ret
  }
}
