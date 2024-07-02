import axios from 'axios'
import { buildSophtronAuthCode } from '../../utils'
import SophtronClient from './'
import providerCredentials from '../../providerCredentials'

interface VcResponse {
  vc: string
}

const { sophtron: sophtronProviderCredentials } = providerCredentials

const { clientId, secret, vcEndpoint } = sophtronProviderCredentials

const sophtronClient = new SophtronClient(sophtronProviderCredentials)

export const getVc = async (path: string) => {
  const res = await sophtronClient.getUserIntegrationKey()
  const headers = {
    IntegrationKey: res.IntegrationKey,
    Authorization: buildSophtronAuthCode('get', path, clientId, secret)
  }

  const ret: VcResponse = (
    await axios({
      url: `${vcEndpoint}vc/${path}`,
      method: 'get',
      headers
    })
  ).data

  return ret?.vc
}
