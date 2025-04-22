import type { DataAdapterDependencies } from "./models";
import { mapAccount, mapIdentity, mapTransaction } from "./mapper";
import FinicityClient from "./apiClient";

const createDataAdapter = (
  sandbox: boolean,
  dependencies: DataAdapterDependencies,
) => {
  return async ({
    connectionId,
    type,
    userId,
    accountId,
  }: {
    connectionId: string;
    type: string;
    userId: string;
    accountId?: string;
  }) => {
    const { logClient, envConfig, aggregatorCredentials, getWebhookHostUrl } =
      dependencies;
    const configuration = sandbox
      ? aggregatorCredentials.finicitySandbox
      : aggregatorCredentials.finicityProd;

    const dataClient = new FinicityClient(
      sandbox,
      configuration,
      logClient,
      envConfig,
      getWebhookHostUrl,
    );
    switch (type) {
      case "identity": {
        const customer = await dataClient.getAccountOwnerDetail(
          userId,
          connectionId,
        );
        const identity = mapIdentity(userId, customer);
        return { customers: [identity] };
      }
      case "accounts": {
        const accounts =
          await dataClient.getCustomerAccountsByInstitutionLoginId(
            userId,
            connectionId,
          );
        return { accounts: accounts.map(mapAccount) };
      }
      case "transactions": {
        const startDate = new Date(
          new Date().setDate(new Date().getDate() - 30),
        );
        const transactions = await dataClient.getTransactions(
          userId,
          accountId,
          startDate.toISOString(),
          new Date().toISOString(),
        );
        return {
          transactions: transactions.map((t: any) =>
            mapTransaction(t, accountId),
          ),
        };
      }
    }
  };
};

export const createFinicityProdDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(false, dependencies);
export const createFinicitySandboxDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(true, dependencies);
