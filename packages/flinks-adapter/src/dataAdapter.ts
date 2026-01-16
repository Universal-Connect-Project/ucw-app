import type { Account, DataAdapterDependencies, Transaction } from "./models";
import {
  mapAccount,
  mapTransaction,
  transformAccountsToCustomers,
} from "./mapper";
import FlinksClient from "./apiClient";
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
      cacheClient,
    } = dependencies;

    const dataClient = new FlinksClient(
      sandbox,
      aggregatorCredentials,
      logClient,
      envConfig,
      cacheClient,
    );

    const requestIdResponse = await dataClient.getAuthToken(connectionId || userId)
    switch (type) {
      case VCDataTypes.IDENTITY: {
        const identityResponse =
          await dataClient.GetAccountsSummary(
            requestIdResponse.RequestId,
          );
        return transformAccountsToCustomers(identityResponse.Accounts);
      }
      case VCDataTypes.ACCOUNTS: {
        const accountsResponse =
          await dataClient.GetAccountsSummary(
            requestIdResponse.RequestId,
          );
        return { accounts: accountsResponse.Accounts.map(mapAccount) };
      }
      case VCDataTypes.TRANSACTIONS: {
        const { preparedStartDate, preparedEndDate } =
          getPreparedDateRangeParams({
            startDate,
            endDate,
            defaultEndOverride: new Date(),
          });
        const transactionsResponse = await dataClient.GetAccountsDetail(
          requestIdResponse.RequestId,
          accountId,
          Math.round( (preparedEndDate.getTime() - preparedStartDate.getTime()) / (1000 * 60 * 60 * 24) )
        );
        return {
          transactions: transactionsResponse.Accounts?.[0]?.Transactions?.map(
            (transaction: Transaction) =>
              mapTransaction(transaction, accountId) || [] as any,
          ),
        };
      }
    }
  };
};

export const createFlinksProdDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(false, dependencies);
export const createFlinksSandboxDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(true, dependencies);
