import { VCDataTypes } from "@repo/utils";

import type { VCDependencies } from "./models";
import { getVc as getSophtronVc } from "./getVc";

export type DataParameters = {
  connectionId: string;
  type: VCDataTypes;
  userId: string;
  accountId?: string;
  startTime?: string;
  endTime?: string;
}

export const createSophtronVC = (dependencies: VCDependencies) => {
  return async ({
     accountId,
     connectionId,
     endTime,
     startTime,
     type,
     userId,
   }: DataParameters) => {

    let path = "";

    switch (type) {
      case VCDataTypes.IDENTITY:
        path = `customers/${userId}/members/${connectionId}/identity`;
        break;
      case VCDataTypes.ACCOUNTS:
        path = `customers/${userId}/members/${connectionId}/accounts`;
        break;
      case VCDataTypes.TRANSACTIONS:
        path = `customers/${userId}/accounts/${accountId}/transactions?startTime=${startTime}&endTime=${endTime}`;
        break;
      default:
        break;
    }

    return await getSophtronVc(path, dependencies);
  }
};
