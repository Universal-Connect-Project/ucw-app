import { VCDataTypes } from "@repo/utils";

import { createDataAdapter } from "./createDataAdapter";
import type { AdapterDependencies } from "./models";
import { sophtronTestData, createLogClient } from "@repo/utils-dev-dependency";

const { aggregatorCredentials } = sophtronTestData;

const dependencies: AdapterDependencies = {
  logClient: createLogClient(),
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

    const result = (await dataAdapter({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    })) as { accounts: any[] };
    expect(result.accounts.length).toBeGreaterThan(0);
  });
});
