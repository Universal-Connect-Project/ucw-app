import { VCDataTypes } from "@repo/utils";
import { createMxIntDataAdapter } from "./dataAdapter";
import { createClient } from "@repo/utils/test";
import { mxTestData, createLogClient } from "@repo/utils-dev-dependency";
import type { AdapterDependencies } from "./models";

const { aggregatorCredentials } = mxTestData;

const dependencies: AdapterDependencies = {
  logClient: createLogClient(),
  cacheClient: createClient(),
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

const dataAdapter = createMxIntDataAdapter(dependencies);

describe("dataAdapter", () => {
  it("returns decoded data from the vc endpoint", async () => {
    const connectionId = "connectionId";
    const userId = "userId";

    const result = (await dataAdapter({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    })) as { accounts: any[] };
    expect(result.accounts.length).toBeGreaterThan(0);
  });
});
