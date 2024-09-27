import { VCDataTypes } from "@repo/utils";

import { getVC as getMxVc } from "./getVc";
import type { VCDependencies } from "./models";

export const createMXGetVC = (isProd: boolean, dependencies: VCDependencies) => {
  return async ({
                  connectionId,
                  type,
                  userId,
                  accountId
                }: {
    connectionId: string
    type: string
    userId: string
    accountId?: string
  }) => {
    let path = "";
    const { logClient, aggregatorCredentials } = dependencies;

    switch (type) {
      case VCDataTypes.IDENTITY:
        path = `users/${userId}/members/${connectionId}/customers?filters=name,addresses`;
        break;
      case VCDataTypes.ACCOUNTS:
        path = `users/${userId}/members/${connectionId}/accounts`;
        break;
      case VCDataTypes.TRANSACTIONS:
        path = `users/${userId}/accounts/${accountId}/transactions`;
        break;
      default:
        break;
    }

    logClient.info(`Getting mx vc ${type}`, path);

    return await getMxVc(path, isProd, {
      logClient,
      aggregatorCredentials
    });
  };
};

export const mxProdGetVC = (dependencies: VCDependencies) => createMXGetVC(true, dependencies);
export const mxIntGetVC = (dependencies: VCDependencies) => createMXGetVC(false, dependencies);
