import type { Account, DataAdapterDependencies, Transaction } from "./models";
import {
  mapAccount,
  mapTransaction,
  transformAccountsToCustomers,
} from "./mapper";
import FinicityClient from "./apiClient";
import { VCDataTypes } from "@repo/utils";

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
    const {
      logClient,
      envConfig,
      aggregatorCredentials,
      getWebhookHostUrl,
      cacheClient,
    } = dependencies;

    const dataClient = new FinicityClient(
      sandbox,
      aggregatorCredentials,
      logClient,
      envConfig,
      getWebhookHostUrl,
      cacheClient,
    );
    switch (type) {
      case VCDataTypes.IDENTITY: {
        const accounts: Account[] =
          await dataClient.getCustomerAccountsByInstitutionLoginId(
            userId,
            connectionId,
          );

        const accountsWithHolders = [];

        for (const account of accounts) {
          const ownerDetails = await dataClient.getAccountOwnerDetail(
            userId,
            account.id,
          );
          accountsWithHolders.push({ ...account, holders: ownerDetails });
        }

        return transformAccountsToCustomers(accountsWithHolders);
      }
      case VCDataTypes.ACCOUNTS: {
        const accounts =
          await dataClient.getCustomerAccountsByInstitutionLoginId(
            userId,
            connectionId,
          );

        const accountsWithAchDetails = [];

        const accountTypesWithAchSupport = [
          "checking",
          "savings",
          "moneyMarket",
          "certificateOfDeposit",
        ];

        for (const account of accounts) {
          if (accountTypesWithAchSupport.includes(account.type)) {
            const achDetails = await dataClient.getAccountAchDetail(
              userId,
              account.id,
            );
            accountsWithAchDetails.push({ ...account, achDetails });
          } else {
            accountsWithAchDetails.push(account);
          }
        }

        return { accounts: accountsWithAchDetails.map(mapAccount) };
      }
      case VCDataTypes.TRANSACTIONS: {
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
          transactions: transactions.map((transaction: Transaction) =>
            mapTransaction(transaction, accountId),
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
