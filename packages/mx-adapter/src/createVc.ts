import { VCDataTypes } from '@repo/utils'
import { logClient } from './adapter'
import { getVC as getMxVc } from './getVc'

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

    logClient.info(`Getting mx vc ${type}`, path)

    return await getMxVc(path, isProd)
  }
}

export const mxProdGetVC = createMXGetVC(true)
export const mxIntGetVC = createMXGetVC(false)
