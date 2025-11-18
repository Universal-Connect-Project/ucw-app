import type { DataAdapterDependencies } from "./models";

import {
  getAuth,
  getAccounts,
  getIdentity,
  getTransactions,
} from "./apiClient";
import {
  DataAdapterRequestParams,
  getPreparedDateRangeParams,
  VCDataTypes,
} from "@repo/utils";
import { transformPlaidAccountsToFdx } from "./fdxDataTransforming/accounts";
import type {
  FdxAccountsResponse,
  FdxIdentityResponse,
  FdxTransactionsResponse,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";
import { transformPlaidIdentityToFdxCustomers } from "./fdxDataTransforming/identity";
import {
  formatDateForPlaid,
  mapPlaidTransactionToFdx,
  PlaidTransaction,
} from "./fdxDataTransforming/transactions";

const createDataAdapter = (
  sandbox: boolean,
  dependencies: DataAdapterDependencies,
) => {
  return async ({
    connectionId,
    type,
    userId: _userId,
    accountId,
    startDate,
    endDate,
  }: DataAdapterRequestParams): Promise<
    FdxAccountsResponse | FdxIdentityResponse | FdxTransactionsResponse | void
  > => {
    const { logClient, aggregatorCredentials } = dependencies;

    const credentials = sandbox
      ? aggregatorCredentials.plaidSandbox
      : aggregatorCredentials.plaidProd;

    if (!credentials?.clientId || !credentials?.secret) {
      throw new Error("Plaid credentials not found");
    }

    const commonParams = {
      accessToken: connectionId, // In Plaid, connectionId is the access token
      clientId: credentials.clientId,
      secret: credentials.secret,
      sandbox,
    };

    switch (type) {
      case VCDataTypes.IDENTITY: {
        logClient.debug(
          `Fetching identity data for connection: ${connectionId}`,
        );
        const identity = await getIdentity(commonParams);

        return transformPlaidIdentityToFdxCustomers(identity.data || []);
      }

      case VCDataTypes.ACCOUNTS: {
        logClient.debug(
          `Fetching accounts data for connection: ${connectionId}`,
        );

        const accountsResponse = await getAccounts(commonParams);

        let accountNumbersData = null;
        try {
          // Try to get account numbers (auth info) - this may fail if auth product not consented
          const accountNumbersResponse = await getAuth(commonParams);
          accountNumbersData = accountNumbersResponse.data;
        } catch (error) {
          // Log the error but continue - we'll just return accounts without routing info
          logClient.debug(
            `Could not fetch account numbers (likely missing auth consent): ${error}`,
          );
        }

        const mergedResponse = {
          ...accountsResponse.data,
          numbers: accountNumbersData?.numbers || undefined,
        };

        return transformPlaidAccountsToFdx(mergedResponse);
      }

      case VCDataTypes.TRANSACTIONS: {
        const { preparedStartDate, preparedEndDate } =
          getPreparedDateRangeParams({
            startDate,
            endDate,
            defaultEndOverride: new Date(),
          });

        const formattedStartDate = formatDateForPlaid(preparedStartDate);
        const formattedEndDate = formatDateForPlaid(preparedEndDate);

        const transactionsResponse = await getTransactions({
          ...commonParams,
          accountIds: [accountId],
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        });

        const transactions = (transactionsResponse.data.transactions ||
          []) as PlaidTransaction[];
        const accountType = transactionsResponse.data.accounts[0]?.type;

        return {
          transactions: transactions.map((transaction) =>
            mapPlaidTransactionToFdx({ transaction, accountId, accountType }),
          ),
        };
      }
    }
  };
};

export const createPlaidProdDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(false, dependencies);

export const createPlaidSandboxDataAdapter = (
  dependencies: DataAdapterDependencies,
) => createDataAdapter(true, dependencies);
