import { VCDataTypes } from "@repo/utils";

import { createDataAdapter } from "./createDataAdapter";
import { logClient } from "./test/utils/logClient";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";
import type { AdapterDependencies } from "./models";

const dependencies: AdapterDependencies = {
  logClient,
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

const dataAdapter = createDataAdapter(dependencies);

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
