import { VCDataTypes } from "@repo/utils";
import { getVC } from "./getVc";
import type { VCDependencies } from "./models";

export interface DataParameters {
  connectionId: string;
  type: string;
  userId: string;
  accountId?: string;
}

const createMXGetVC =
  (isProd: boolean, dependencies: VCDependencies) =>
  async ({ connectionId, type, userId, accountId }: DataParameters) => {
    let path = "";
    const { logClient, aggregatorCredentials, envConfig } = dependencies;

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

    return await getVC(path, isProd, {
      logClient,
      aggregatorCredentials,
      envConfig,
    });
  };

export const createMxProdGetVC = (dependencies: VCDependencies) =>
  createMXGetVC(true, dependencies);
export const createMxIntGetVC = (dependencies: VCDependencies) =>
  createMXGetVC(false, dependencies);
