import AkoyaClient from '../../providerApiClients/akoya'
import providerCredentials from '../../providerCredentials'

interface Account {
  accountId: string
};

export default async function GetVc(
  connectionId: string,
  type: string,
  userId: string
) {
  const vcClient = new AkoyaClient(providerCredentials.akoyaProd)
  const token = await vcClient.getIdToken(userId)
  switch (type) {
    case 'identity': {
      const customer = await vcClient.getCustomerInfo(connectionId, token.id_token)
      return { credentialSubject: { customer } }
    }
    case 'accounts': {
      const accounts = await vcClient.getAccountInfo(connectionId, [], token.id_token)
      return { credentialSubject: { accounts } }
    }
    case 'transactions': {
      const allAccounts = await vcClient.getAccountInfo(connectionId, [], token.id_token)
      const accountId = (Object.values(allAccounts[0])[0] as Account).accountId
      const transactions = await vcClient.getTransactions(connectionId, accountId, token.id_token)
      return { credentialSubject: { transactions } }
    }
  }
}
