import type { VCDependencies } from "./models";
import { getVc as getSophtronVc } from "./getVc";
import {
  getPreparedDateRangeParams,
  VCDataTypes,
  type DataAdapterRequestParams,
} from "@repo/utils";

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
      case VCDataTypes.TRANSACTIONS: {
        const { preparedStartDate, preparedEndDate } =
          getPreparedDateRangeParams({
            startDate,
            endDate,
            validDatePattern: /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
          });
        params = {
          startTime: preparedStartDate.toISOString().slice(0, 10),
          endTime: preparedEndDate.toISOString().slice(0, 10),
        };
        path = `customers/${userId}/accounts/${accountId}/transactions`;
        break;
      }
      default:
        break;
    }

    return await getSophtronVc(path, dependencies, params);
  };
};
