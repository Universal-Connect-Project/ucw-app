import type { Account, DataAdapterDependencies, Transaction } from "./models";
import {
  mapAccount,
  mapTransaction,
  transformAccountsToCustomers,
} from "./mapper";
import FinicityClient from "./apiClient";
import { DataAdapterRequestParams, VCDataTypes } from "@repo/utils";

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
        const { fromDate, toDate } = getPreparedDateRangeParams(
          startDate,
          endDate,
        );
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

const getPreparedDateRangeParams = (
  startDate?: string,
  endDate?: string,
): { fromDate: string; toDate: string } => {
  return {
    fromDate: getPreparedStartDate(startDate),
    toDate: getPreparedEndDate(endDate),
  };
};

const getPreparedStartDate = (startDate?: string): string => {
  if (startDate) {
    const date = new Date(startDate);
    if (!isNaN(date.getTime())) {
      return String(Math.floor(date.getTime() / 1000));
    } else {
      throw new Error("startDate must be a valid ISO 8601 date string");
    }
  }
  const now = new Date();
  const daysAgo = new Date(now.setDate(now.getDate() - 120));
  return String(Math.floor(daysAgo.getTime() / 1000));
};

const getPreparedEndDate = (endDate?: string): string => {
  if (endDate) {
    const date = new Date(endDate);
    if (!isNaN(date.getTime())) {
      return String(Math.floor(date.getTime() / 1000));
    } else {
      throw new Error("endDate must be a valid ISO 8601 date string");
    }
  }
  return String(Math.floor(Date.now() / 1000));
};

export const createFinicityProdDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(false, dependencies);
export const createFinicitySandboxDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(true, dependencies);
