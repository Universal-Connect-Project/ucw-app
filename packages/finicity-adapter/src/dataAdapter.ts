import type { VCDependencies } from "./models";
import { mapAccount, mapIdentity, mapTransaction } from './mapper'
import FinicityClient from './apiClient';

const createDataAdapter = (sandbox: boolean, dependencies: VCDependencies) => {
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

    const dataClient =  new FinicityClient(sandbox, configuration, logClient, envConfig)
    switch(type){
      case 'identity': {
        const customer = await dataClient.getAccountOwnerDetail(userId, accountId);
        const identity = mapIdentity(userId, customer)
        return {credentialSubject: { customer: identity}}
      };
      case 'accounts':{
        const accounts = await dataClient.getCustomerAccountsByInstitutionLoginId(userId, connectionId);
        return {credentialSubject: { accounts: accounts.map(mapAccount)}};
      }
      case 'transactions':{
        const startDate = new Date(new Date().setDate(new Date().getDate() - 30))
        const transactions = await dataClient.getTransactions(userId, accountId, startDate.toISOString(), new Date().toISOString());
        return {credentialSubject: {transactions: transactions.map((t: any) => mapTransaction(t, accountId))}};
      }
    }
  };
};

export const createFinicityProdDataAdapter = (dependencies: VCDependencies) => createDataAdapter(false, dependencies);
export const createFinicitySandboxDataAdapter = (dependencies: VCDependencies) => createDataAdapter(true, dependencies);