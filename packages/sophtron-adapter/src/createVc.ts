import type { VCDependencies } from "./models";
import { getVc as getSophtronVc } from "./getVc";
import { VCDataTypes, type DataAdapterRequestParams } from "@repo/utils";

const getPreparedDateRangeParams = (startDate?: string, endDate?: string) => {
  let startTime: string;
  let endTime: string;
  const acceptedPattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;

  if (startDate) {
    const date = new Date(startDate);
    if (!isNaN(date.getTime()) && acceptedPattern.test(startDate)) {
      startTime = date.toISOString().slice(0, 10);
    } else {
      throw new Error("startDate must be a valid ISO 8601 date string");
    }
  } else {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    startTime = oneYearAgo.toISOString().slice(0, 10);
  }

  if (endDate) {
    const date = new Date(endDate);
    if (!isNaN(date.getTime()) && acceptedPattern.test(endDate)) {
      endTime = date.toISOString().slice(0, 10);
    } else {
      throw new Error("endDate must be a valid ISO 8601 date string");
    }
  } else {
    const fiveDaysFuture = new Date();
    fiveDaysFuture.setDate(fiveDaysFuture.getDate() + 5);
    endTime = fiveDaysFuture.toISOString().slice(0, 10);
  }

  return { startTime, endTime };
};

export const createSophtronVC = (dependencies: VCDependencies) => {
  return async ({
    accountId,
    connectionId,
    startDate,
    endDate,
    type,
    userId,
  }: DataAdapterRequestParams) => {
    let path = "";
    let params;

    switch (type) {
      case VCDataTypes.IDENTITY:
        path = `customers/${userId}/members/${connectionId}/identity`;
        break;
      case VCDataTypes.ACCOUNTS:
        path = `customers/${userId}/members/${connectionId}/accounts`;
        break;
      case VCDataTypes.TRANSACTIONS:
        params = getPreparedDateRangeParams(startDate, endDate);
        path = `customers/${userId}/accounts/${accountId}/transactions`;
        break;
      default:
        break;
    }

    return await getSophtronVc(path, dependencies, params);
  };
};
