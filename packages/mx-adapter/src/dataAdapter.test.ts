import { VCDataTypes } from "@repo/utils";
import { createMxIntDataAdapter } from "./dataAdapter";
import { createClient, createLogClient } from "@repo/utils/test";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";
import type { AdapterDependencies } from "./models";

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

    const result = await dataAdapter({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(result.accounts.length).toBeGreaterThan(0);
  });
});
