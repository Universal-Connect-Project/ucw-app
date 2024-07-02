import { info } from '../../infra/logger'
import { getVc as getMxVc } from '../../providerApiClients/mxClient/vc'
import providerCredentials from '../../providerCredentials'

const { mxInt, mxProd } = providerCredentials

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
  if (path !== '') {
    info(`Getting mx vc ${type}`, path)

    return await getMxVc(path, isProd)
  }
  return null
}
