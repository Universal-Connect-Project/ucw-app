import { getVc as getSophtronVc } from '../../aggregatorApiClients/sophtronClient/vc'
import { VCDataTypes } from '@repo/utils'

export default async function getVC({
  accountId,
  connectionId,
  endTime,
  startTime,
  type,
  userId
}: {
  connectionId: string
  type: VCDataTypes
  userId: string
  accountId?: string
  startTime?: string
  endTime?: string
}) {
  let path = ''
  switch (type) {
    case VCDataTypes.IDENTITY:
      path = `customers/${userId}/members/${connectionId}/identity`
      break
    case VCDataTypes.ACCOUNTS:
      path = `customers/${userId}/members/${connectionId}/accounts`
      break
    case VCDataTypes.TRANSACTIONS:
      path = `customers/${userId}/accounts/${accountId}/transactions?startTime=${startTime}&endTime=${endTime}`
      break
    default:
      break
  }

  return await getSophtronVc(path)
}
