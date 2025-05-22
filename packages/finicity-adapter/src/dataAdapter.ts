import type { Account, DataAdapterDependencies, Transaction } from "./models";
import {
  mapAccount,
  mapTransaction,
  transformAccountsToCustomers,
} from "./mapper";
import FinicityClient from "./apiClient";
import {
  DataAdapterRequestParams,
  getPreparedDateRangeParams,
  VCDataTypes,
} from "@repo/utils";

const createDataAdapter = (
  sandbox: boolean,
  dependencies: DataAdapterDependencies,
) => {
  return async ({
    connectionId,
    type,
    userId,
    accountId,
    startDate,
    endDate,
  }: DataAdapterRequestParams) => {
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
        const { preparedStartDate, preparedEndDate } =
          getPreparedDateRangeParams({
            startDate,
            endDate,
            defaultEndOverride: new Date(),
          });
        const fromDate = String(Math.floor(preparedStartDate.getTime() / 1000));
        const toDate = String(Math.floor(preparedEndDate.getTime() / 1000));
        const transactions = await dataClient.getTransactions(
          userId,
          accountId,
          fromDate,
          toDate,
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
