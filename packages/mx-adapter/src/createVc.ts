import type { DataAdapterRequestParams } from "@repo/utils";
import { getPreparedDateRangeParams, VCDataTypes } from "@repo/utils";
import { getVC } from "./getVc";
import type { VCDependencies } from "./models";

const createMXGetVC =
  (isProd: boolean, dependencies: VCDependencies) =>
  async ({
    connectionId,
    type,
    userId,
    accountId,
    startDate,
    endDate,
  }: DataAdapterRequestParams) => {
    let path = "";
    let params;
    const { logClient, aggregatorCredentials, envConfig } = dependencies;

    switch (type) {
      case VCDataTypes.IDENTITY:
        path = `users/${userId}/members/${connectionId}/customers?filters=name,addresses`;
        break;
      case VCDataTypes.ACCOUNTS:
        path = `users/${userId}/members/${connectionId}/accounts`;
        break;
      case VCDataTypes.TRANSACTIONS: {
        const { preparedStartDate, preparedEndDate } =
          getPreparedDateRangeParams({ startDate, endDate });
        params = {
          startTime: preparedStartDate.toISOString().slice(0, 10),
          endTime: preparedEndDate.toISOString().slice(0, 10),
        };
        path = `users/${userId}/accounts/${accountId}/transactions`;
        break;
      }
      default:
        break;
    }

    logClient.info(`Getting mx vc ${type}`, path);

    return await getVC(
      path,
      isProd,
      {
        logClient,
        aggregatorCredentials,
        envConfig,
      },
      params,
    );
  };

export const createMxProdGetVC = (dependencies: VCDependencies) =>
  createMXGetVC(true, dependencies);
export const createMxIntGetVC = (dependencies: VCDependencies) =>
  createMXGetVC(false, dependencies);
