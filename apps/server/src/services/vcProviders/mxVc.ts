import { MxVcClient } from '../../providerApiClients/mxClient/vc'
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
    console.info(`Getting mx vc ${type}`, path)
    const vcClient = isProd ? new MxVcClient(mxProd) : new MxVcClient(mxInt)
    return await vcClient.getVC(path)
  }
  return null
}
