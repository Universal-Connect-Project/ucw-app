import axios from 'axios'
import { debug, error } from '../../infra/logger'
import aggregatorCredentials from '../../aggregatorCredentials'

export const getVc = async (path: string, isProd: boolean) => {
  const configuration = isProd
    ? aggregatorCredentials.mxProd
    : aggregatorCredentials.mxInt

  const authHeader =
    'Basic ' +
    Buffer.from(configuration.username + ':' + configuration.password).toString(
      'base64'
    )

  const url = `${configuration.basePath}/vc/${path}`

  return await axios({
    method: 'get',
    url,
    headers: {
      Accept: 'application/vnd.mx.api.v1beta+json',
      'content-type': 'application/json',
      Authorization: authHeader
    }
  })
    .then((res) => {
      debug(`mx vc client http response status ${res.status} from ${url}`)

      return res.data?.verifiableCredential
    })
    .catch((err) => {
      error(
        `mx vc client http response status ${err.response?.status} from ${url}`,
        err.response?.data || err
      )

      throw new Error('MX VC endpoint failure')
    })
}
