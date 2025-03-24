import { VCDataTypes } from "@repo/utils";

import type { AdapterDependencies } from "./models";
import { logClient } from "./test/utils/logClient";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";
import { createSophtronVC } from "./createVc";

import {
  sophtronVcTranscationsData,
  sophtronVcAccountsData,
  sophtronVcIdentityData,
} from "./test/testData/sophtronVcData";

const dependencies: AdapterDependencies = {
  logClient,
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

describe("getVc", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";

  it("gets accounts VC", async () => {
    const vc = await (
      createSophtronVC(dependencies)
    )({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(sophtronVcAccountsData);
  });

  it("gets identity VC", async () => {
    const vc = await (
      createSophtronVC(dependencies)
    )({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId,
    });
    expect(vc).toEqual(sophtronVcIdentityData);
  });

  it("gets transactions VC", async () => {
    const vc = await (
      createSophtronVC(dependencies)
    )({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
  });
});
