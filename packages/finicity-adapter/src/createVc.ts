import type { VCDependencies } from "./models";
import { mapAccount, mapIdentity, mapTransaction } from './mapper'
import FinicityClient from './apiClient';

const createFinicityGetVC = (sandbox: boolean, dependencies: VCDependencies) => {
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
    const { logClient, envConfig, aggregatorCredentials } = dependencies;
    const configuration = sandbox
      ? aggregatorCredentials.finicitySandbox
      : aggregatorCredentials.finicityProd;

    const vcClient =  new FinicityClient(sandbox, configuration, logClient, envConfig)
    switch(type){
      case 'identity':
        let customer = await vcClient.getAccountOwnerDetail(userId, accountId);
        let identity = mapIdentity(userId, customer)
        return {credentialSubject: { customer: identity}};
      case 'accounts':
        let accounts = await vcClient.getCustomerAccountsByInstitutionLoginId(userId, connectionId);
        return {credentialSubject: { accounts: accounts.map(mapAccount)}};
      case 'transactions':
        let startDate = new Date(new Date().setDate(new Date().getDate() - 30))
        const transactions = await vcClient.getTransactions(userId, accountId, startDate, new Date());
        return {credentialSubject: {transactions: transactions.map((t) => mapTransaction(t, accountId))}};
    }
  };
};

export const createFinicityProdGetVC = (dependencies: VCDependencies) => createFinicityGetVC(false, dependencies);
export const createFinicitySandboxGetVC = (dependencies: VCDependencies) => createFinicityGetVC(true, dependencies);
