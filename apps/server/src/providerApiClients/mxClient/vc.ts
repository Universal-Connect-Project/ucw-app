import axios from 'axios'
import { debug, error } from '../../infra/logger'
import providerCredentials from '../../providerCredentials'

async function request(
  url: string,
  method: 'get' | 'post' | 'put' | 'delete',
  data: any,
  clientId: string,
  secret: string
) {
  const authHeader =
    'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64')

  return await axios({
    method,
    url,
    data,
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

export const getVc = (path: string, isProd: boolean) => {
  const configuration = isProd
    ? providerCredentials.mxProd
    : providerCredentials.mxInt

  return request(
    `${configuration.basePath}/vc/${path}`,
    'get',
    null,
    configuration.username,
    configuration.password
  )
}
