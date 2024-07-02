import axios from 'axios'
import { buildSophtronAuthCode } from '../../utils'
import SophtronClient from './'
import SophtronBaseClient from './base'

interface VcResponse {
  vc: string
}

export default class SophtronVcClient extends SophtronBaseClient {
  sophtronClient: SophtronClient
  constructor(apiConfig: any) {
    super(apiConfig)
    this.sophtronClient = new SophtronClient(apiConfig)
  }

  async getVC(path: string) {
    const res = await this.sophtronClient.getUserIntegrationKey()
    const headers = {
      IntegrationKey: res.IntegrationKey,
      Authorization: buildSophtronAuthCode(
        'get',
        path,
        this.apiConfig.clientId,
        this.apiConfig.secret
      )
    }

    const ret: VcResponse = (
      await axios({
        url: `${this.apiConfig.vcEndpoint}vc/${path}`,
        method: 'get',
        headers
      })
    ).data

    return ret?.vc
  }
}
