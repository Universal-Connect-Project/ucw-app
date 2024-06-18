import config from '../../config'
import SophtronBaseClient from './base'

export default class SophtronV2Client extends SophtronBaseClient {
  async getCustomer (customerId) {
    return await this.get(`/v2/customers/${customerId}`)
  }

  async getCustomerByUniqueName (uniqueName) {
    const arr = await this.get(`/v2/customers?uniqueID=${uniqueName}`)
    return arr?.[0]
  }

  async createCustomer (uniqueName) {
    return await this.post('/v2/customers', {
      UniqueID: uniqueName,
      Source: `Universal_Widget_${config.HostUrl}`,
      Name: 'UniversalWidget_Customer'
    })
  }

  async getMember (customerId, memberId) {
    return await this.get(`/v2/customers/${customerId}/members/${memberId}`)
  }

  async createMember (customerId, jobType, username, password, institutionId) {
    return await this.post(`/v2/customers/${customerId}/members/${jobType}`, {
      UserName: username,
      Password: password,
      InstitutionID: institutionId
    })
  }

  async updateMember (customerId, memberId, jobType, username, password) {
    return await this.put(`/v2/customers/${customerId}/members/${memberId}/${jobType}`, {
      UserName: username,
      Password: password
    })
  }

  async refreshMember (customerId, memberId, jobType) {
    return await this.post(`/v2/customers/${customerId}/members/${memberId}/${jobType}`)
  }

  async deleteMember (customerId, memberId) {
    return await this.del(`/v2/customers/${customerId}/members/${memberId}`)
  }

  async getJobInfo (jobId) {
    return await this.get(`/v2/job/${jobId}`)
  }

  async answerJobMfa(jobId, mfaType, answer) {
    return await this.put(`/v2/job/${jobId}/challenge/${mfaType}`, { AnswerText: answer })
  }
}
