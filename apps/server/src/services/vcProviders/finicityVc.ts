import FinicityClient from '../../providerApiClients/finicity'
import providerCredentials from '../../providerCredentials'
import { finicity as mapper } from './adapters'

export default async function GetVc(
  connectionId: string,
  type: string,
  userId: string
) {
  const vcClient = new FinicityClient(providerCredentials.finicityProd)
  const accounts = await vcClient.getCustomerAccountsByInstitutionLoginId(userId, connectionId)
  const accountId = accounts?.[0].id
  switch (type) {
    case 'identity': {
      const customer = await vcClient.getAccountOwnerDetail(userId, accountId)
      const identity = mapper.mapIdentity(userId, customer)
      return { credentialSubject: { customer: identity } }
    }
    case 'accounts':
      return { credentialSubject: { accounts: accounts.map(mapper.mapAccount) } }
    case 'transactions': {
      const startDate = new Date(new Date().setDate(new Date().getDate() - 30))
      const transactions = await vcClient.getTransactions(userId, accountId, startDate.toString(), new Date().toString())
      return { credentialSubject: { transactions: transactions.map((t: { type: any, amount: any, id: any, postedDate: any, transactionDate: string | number | Date, description: any, memo: any, Category: any, Status: any, categorization: { normalizedPayeeName: any }, checkNum: any }) => mapper.mapTransaction(t, accountId)) } }
    }
  }
}
