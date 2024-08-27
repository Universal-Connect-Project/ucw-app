import { VCDataTypes } from '@repo/utils'
import { info } from '../../infra/logger'
import { getVc as getMxVc } from '../../providerApiClients/mxClient/vc'

export default async function getVC(
  isProd: boolean,
  connectionId: string,
  type: string,
  userId: string,
  accountId?: string
) {
  let path = ''
  switch (type) {
    case VCDataTypes.IDENTITY:
      path = `users/${userId}/members/${connectionId}/customers?filters=name,addresses`
      break
    case VCDataTypes.ACCOUNTS:
      path = `users/${userId}/members/${connectionId}/accounts`
      break
    case VCDataTypes.TRANSACTIONS:
      path = `users/${userId}/accounts/${accountId}/transactions`
      break
    default:
      break
  }

  info(`Getting mx vc ${type}`, path)

  return await getMxVc(path, isProd)
}
