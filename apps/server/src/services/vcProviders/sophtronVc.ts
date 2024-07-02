import SophtronVcClient from '../../providerApiClients/sophtronClient/vc'
import providerCredentials from '../../providerCredentials'

export default async function getVC(
  connectionId: string,
  type: string,
  userId: string,
  accountId: string,
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
      path = `customers/${userId}/accounts/${accountId}/transactions?startTime=${startTime}&endTime=${endTime}`
      break
    default:
      break
  }
  if (path) {
    const vcClient = new SophtronVcClient(providerCredentials.sophtron)
    return await vcClient.getVC(path).then((vc) => {
      // for data security purpose when doing demo, should remove the connection once vc is returned to client.
      // clearConnection(vc, connectionId, userId);
      // console.log(vc)
      return vc
    })
  }
  return null
}