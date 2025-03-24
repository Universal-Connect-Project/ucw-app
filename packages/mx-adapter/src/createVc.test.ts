import { VCDataTypes } from "@repo/utils";

import type { AdapterDependencies } from "./models";
import { logClient } from "./test/utils/logClient";
import { createMxIntGetVC, createMxProdGetVC } from "./createVc";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";

import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData,
} from "./test/testData/mxVcData";
import { createClient } from "./test/utils/cacheClient";

const dependencies: AdapterDependencies = {
  logClient,
  cacheClient: createClient(),
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

describe("getVc", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";

  it("gets accounts VC from INT environment", async () => {
    const vc = await createMxIntGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(mxVcIntegrationAccountsData);
  });

  it("gets identity VC from Prod environment", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId,
    });
    expect(vc).toEqual(mxVcIdentityData);
  });

  it("gets accounts VC from Prod environment", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(mxVcAccountsData);
  });

  it("gets transactions VC from Prod environment", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });
    expect(vc).toEqual(mxVcTranscationsData);
  });
});
