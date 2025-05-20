import type { DataAdapterRequestParams } from "@repo/utils";
import { VCDataTypes } from "@repo/utils";
import { getVC } from "./getVc";
import type { VCDependencies } from "./models";

const getPreparedDateRangeParams = (startDate?: string, endDate?: string) => {
  let startTime: string;
  let endTime: string;
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!startDate && !endDate) {
    return undefined;
  }

  if (startDate) {
    const date = new Date(startDate);
    if (!isNaN(date.getTime()) && iso8601Pattern.test(startDate)) {
      startTime = date.toISOString().slice(0, 10);
    } else {
      throw new Error("startDate must be a valid ISO 8601 date string");
    }
  } else {
    startTime = undefined;
  }

  if (endDate) {
    const date = new Date(endDate);
    if (!isNaN(date.getTime()) && iso8601Pattern.test(endDate)) {
      endTime = date.toISOString().slice(0, 10);
    } else {
      throw new Error("endDate must be a valid ISO 8601 date string");
    }
  } else {
    endTime = undefined;
  }

  return { startTime, endTime };
};

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
      case VCDataTypes.TRANSACTIONS:
        params = getPreparedDateRangeParams(startDate, endDate);
        path = `users/${userId}/accounts/${accountId}/transactions`;
        break;
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
