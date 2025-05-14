import { createLogClient } from "@repo/utils/test";
import { VCDataTypes } from "@repo/utils";

import type { AdapterDependencies } from "./models";
import { sophtronTestData } from "@repo/utils-dev-dependency";
import { createSophtronVC } from "./createVc";

const {
  aggregatorCredentials,
  sophtronVcTranscationsData,
  sophtronVcAccountsData,
  sophtronVcIdentityData,
} = sophtronTestData;

const dependencies: AdapterDependencies = {
  logClient: createLogClient(),
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
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(sophtronVcAccountsData);
  });

  it("gets identity VC", async () => {
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId,
    });
    expect(vc).toEqual(sophtronVcIdentityData);
  });

  it("gets transactions VC", async () => {
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
  });
});
