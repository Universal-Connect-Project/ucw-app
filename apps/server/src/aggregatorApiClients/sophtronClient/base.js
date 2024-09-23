import { buildSophtronAuthCode } from '../../utils'
import { get, post, put, del } from '../../infra/http'

export default class SophtronBaseClient {
  apiConfig
  constructor(apiConfig) {
    this.apiConfig = apiConfig
  }

  getAuthHeaders(method, path) {
    return {
      Authorization: buildSophtronAuthCode(
        method,
        path,
        this.apiConfig.clientId,
        this.apiConfig.secret
      )
    }
  }

  async post(path, data) {
    const authHeader = this.getAuthHeaders('post', path)
    const ret = await post(this.apiConfig.endpoint + path, data, authHeader)
    return ret
  }

  async get(path) {
    const authHeader = this.getAuthHeaders('get', path)
    const ret = await get(this.apiConfig.endpoint + path, authHeader)
    return ret
  }

  async put(path, data) {
    const authHeader = this.getAuthHeaders('put', path)
    const ret = await put(this.apiConfig.endpoint + path, data, authHeader)
    return ret
  }

  async del(path) {
    const authHeader = this.getAuthHeaders('delete', path)
    const ret = await del(this.apiConfig.endpoint + path, authHeader)
    return ret
  }
}
