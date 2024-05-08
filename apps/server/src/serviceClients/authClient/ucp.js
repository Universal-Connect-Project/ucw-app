import { decrypt } from '../../utils'
import config from '../../config'
import { get } from '../../infra/http'

export class AuthClient {
  token
  constructor (token) {
    this.token = token
  }

  async getSecretExchange (iv) {
    const encrypted = await this.get(`/secretexchange?key=${encodeURIComponent(this.token)}`)
    const arr = encrypted.split('#')
    const secret = arr.length === 2 ? arr[0] : config.UcpAuthEncryptionKey

    const key = Buffer.from(secret, 'base64').toString('hex')
    const configStr = decrypt(arr.length === 2 ? arr[1] : encrypted, key, iv)
    return JSON.parse(configStr)
  }

  async get (path) {
    const phrase = 'basic ' + Buffer.from(`${config.UcpAuthClientId}:${config.UcpAuthClientSecret}`).toString('base64')
    const ret = await get(config.AuthServiceEndpoint + path, { Authorization: phrase, token: this.token })
    return ret
  }
}
