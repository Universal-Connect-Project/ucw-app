import { buildSophtronAuthCode } from '../../utils'
import { post } from '../../infra/http'
import config from '../../config'

export class AnalyticsClient {
  token
  constructor (token) {
    this.token = token
  }

  async analytics (type, data) {
    const ret = this.post(`${config.AnalyticsServiceEndpoint}${config.ServiceName}/${type}`, data)
    return await ret
  }

  async post (path, data) {
    const phrase = buildSophtronAuthCode('get', path, config.SophtronClientId, config.SophtronClientSecret)
    const ret = await post(config.AnalyticsServiceEndpoint + path, data, { Authorization: phrase, IntegrationKey: this.token })
    return ret
  }
}
