import axios from 'axios'
import { buildSophtronAuthCode } from '../../utils'
import SophtronClient from './'
import aggregatorCredentials from 'src/aggregatorCredentials'

interface VcResponse {
  vc: string
}

const { sophtron: sophtronAggregatorCredentials } = aggregatorCredentials

const { clientId, secret, vcEndpoint } = sophtronAggregatorCredentials

const sophtronClient = new SophtronClient(sophtronAggregatorCredentials)

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
