import { get } from '../../infra/http'
import SophtronBaseClient from './base'

export default class SophtronVcClient extends SophtronBaseClient {
  async getVc (path, userId) {
    const headers = { IntegrationKey: this.apiConfig.token }
    if (userId != null) {
      headers.DidAuth = userId
    }
    const ret = await get(`${this.apiConfig.vcEndpoint}vc/${path}`, headers)
    return ret
  }
}
