import { createLogClient } from "@repo/utils/test";
import { sophtronVcTranscationsData } from "./test/testData/sophtronVcData";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";
import { getVc } from "./getVc";

describe("Sophtron Vc Client", () => {
  it("returns the data from a vc endpoint", async () => {
    const response = await getVc(
      "customers/userId/accounts/accountId/transactions",
      {
        logClient: createLogClient(),
        aggregatorCredentials,
        envConfig: {
          HOSTURL: undefined,
        },
      },
    );

    expect(response).toEqual(sophtronVcTranscationsData);
  });
});
