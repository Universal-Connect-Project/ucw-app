import { getVc as getSophtronVc } from '../../providerApiClients/sophtronClient/vc'

export default async function getVC({
  accountId,
  connectionId,
  endTime,
  startTime,
  type,
  userId
}: {
  connectionId: string
  type: string
  userId: string
  accountId?: string
  startTime?: string
  endTime?: string
}) {
  let path = ''
  switch (type) {
    case 'identity':
      path = `customers/${userId}/members/${connectionId}/identity`
      break
    case 'accounts':
    case 'banking':
      path = `customers/${userId}/members/${connectionId}/accounts`
      break
    case 'transactions':
      path = `customers/${userId}/accounts/${accountId}/transactions?startTime=${startTime}&endTime=${endTime}`
      break
    default:
      break
  }

  return await getSophtronVc(path)
}
