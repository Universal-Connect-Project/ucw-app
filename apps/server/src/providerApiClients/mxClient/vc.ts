import axios from 'axios'
import { debug, error } from '../../infra/logger'
import type { ConfigurationParameters } from './configuration'

async function request(url: string, method: 'get' | 'post' | 'put' | 'delete', data: any, clientId: string, secret: string) {
  const authHeader = 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64')

  return await axios({
    method,
    url,
    data,
    headers: {
      Accept: 'application/vnd.mx.api.v1beta+json',
      'content-type': 'application/json',
      Authorization: authHeader
    }
  }).then(res => {
    debug(`mx vc client http response status ${res.status} from ${url}`)
    return res.data?.verifiableCredential || res.data
  }).catch(err => {
    error(`mx vc client http response status ${err.response?.status} from ${url}`, err.response?.data || err)
    return err.response?.data
  })
}

export class MxVcClient {
  configuration: ConfigurationParameters
  constructor(conf: ConfigurationParameters) {
    this.configuration = conf
  }

  async getVC(path: string) {
    return await this._get(`vc/${path}`).then(res => res)
  }

  async _get(url: string) {
    return await request(`${this.configuration.basePath}/${url}`, 'get', null, this.configuration.username, this.configuration.password)
  }
}
