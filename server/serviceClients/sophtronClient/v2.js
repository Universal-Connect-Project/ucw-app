const config = require('../../config')
const logger = require('../../infra/logger')
const http = require('../../infra/http')
const SophtronBaseClient = require('./base')

module.exports = class SophtronV2Client extends SophtronBaseClient {
  constructor (apiConfig) {
    super(apiConfig)
  }

  async getCustomer (customerId) {
    return await this.get(`/v2/customers/${customerId}`)
  }

  async getCustomerByUniqueName (unique_name) {
    const arr = await this.get(`/v2/customers?uniqueID=${unique_name}`)
    return arr?.[0]
  }

  async createCustomer (unique_name) {
    return await this.post('/v2/customers', {
      UniqueID: unique_name,
      Source: `Universal_Widget_${config.HostUrl}`,
      Name: 'UniversalWidget_Customer'
    })
  }

  async getMember (customerId, memberId) {
    return await this.get(`/v2/customers/${customerId}/members/${memberId}`)
  }

  async createMember (customerId, job_type, username, password, institution_id) {
    return await this.post(`/v2/customers/${customerId}/members/${job_type}`, {
      UserName: username,
      Password: password,
      InstitutionID: institution_id
    })
  }

  async updateMember (customerId, memberId, job_type, username, password) {
    return await this.put(`/v2/customers/${customerId}/members/${memberId}/${job_type}`, {
      UserName: username,
      Password: password
    })
  }

  async refreshMember (customerId, memberId, job_type) {
    return await this.post(`/v2/customers/${customerId}/members/${memberId}/${job_type}`)
  }

  async deleteMember (customerId, memberId) {
    return await this.del(`/v2/customers/${customerId}/members/${memberId}`)
  }

  async getJobInfo (jobId) {
    return await this.get(`/v2/job/${jobId}`)
  }
}
