import { VCDataTypes } from '@repo/utils'
import { info } from '../../infra/logger'
import { getVc as getMxVc } from 'src/aggregatorApiClients/mxClient/vc'

export const createMXGetVC = (isProd: boolean) => {
  return async ({
    connectionId,
    type,
    userId,
    accountId
  }: {
    connectionId: string
    type: string
    userId: string
    accountId?: string
  }) => {
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
}

export const mxProdGetVC = createMXGetVC(true)
export const mxIntGetVC = createMXGetVC(false)
