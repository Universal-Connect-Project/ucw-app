import type { DataAdapterDependencies } from "./models";

import { getAuth, getAccounts } from "./apiClient";
import { DataAdapterRequestParams, VCDataTypes } from "@repo/utils";
import { transformPlaidAccountsToFdx } from "./fdxDataTransforming/accounts";
import type { FdxAccountsResponse } from "@repo/utils-dev-dependency/shared/FdxDataTypes";

const createDataAdapter = (
  sandbox: boolean,
  dependencies: DataAdapterDependencies,
) => {
  return async ({
    connectionId,
    type,
    userId: _userId,
    // accountId,
    // startDate,
    // endDate,
  }: DataAdapterRequestParams): Promise<FdxAccountsResponse | void> => {
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
        throw new Error("Identity data type not implemented yet");
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
        throw new Error("Transactions data type not implemented yet");
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
