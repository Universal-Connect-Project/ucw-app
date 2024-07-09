import { getVc as getSophtronVc } from '../../providerApiClients/sophtronClient/vc'

export default async function getVC(
  connectionId: string,
  type: string,
  userId: string,
  accountId?: string,
  startTime?: string,
  endTime?: string
) {
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
      path = `customers/${userId}/accounts/${accountId}/transactions?start_time=${startTime}&end_time=${endTime}`
      break
    default:
      break
  }

  return await getSophtronVc(path)
}
