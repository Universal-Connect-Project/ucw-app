import { post } from '../../infra/http'
import config from '../../config'

export class AnalyticsClient {
  token
  constructor (token) {
    this.token = token
  }

  async analytics (type, data) {
    const ret = this.post(`${config.ServiceName}/${type}`, data)
    return await ret
  }

  async post (path, data) {
    const ret = await post(config.AnalyticsServiceEndpoint + path, data, { Authorization: `token ${this.token}` })
    return ret
  }
}
