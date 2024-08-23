import axios from 'axios'
import { getProviderCredentials } from '../providerCredentials'

export const getMXVc = async (path: string, isProd: boolean) => {
  const providerCredentials = getProviderCredentials()

  const configuration = isProd
    ? providerCredentials.mxProd
    : providerCredentials.mxInt

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
      console.log(`mx vc client http response status ${res.status} from ${url}`)

      return res.data?.verifiableCredential
    })
    .catch((err) => {
      console.log(
        `mx vc client http response status ${err.response?.status} from ${url}`,
        err.response?.data || err
      )

      throw new Error('MX VC endpoint failure')
    })
}

export default async function getVC(
  isProd: boolean,
  connectionId: string,
  type: string,
  userId: string,
  accountId?: string
) {
  let path = ''
  switch (type) {
    case 'identity':
      path = `users/${userId}/members/${connectionId}/customers?filters=name,addresses`
      break
    case 'accounts':
    case 'banking':
      path = `users/${userId}/members/${connectionId}/accounts`
      break
    case 'transactions':
      path = `users/${userId}/accounts/${accountId}/transactions`
      break
    default:
      break
  }

  console.log(`Getting mx vc ${type}`, path)

  return await getMXVc(path, isProd)
}
