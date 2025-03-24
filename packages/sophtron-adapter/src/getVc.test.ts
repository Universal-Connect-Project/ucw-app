import { logClient } from "./test/utils/logClient";
import { sophtronVcTranscationsData } from "./test/testData/sophtronVcData";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";
import { getVc } from "./getVc";

describe("Sophtron Vc Client", () => {
  it("returns the data from a vc endpoint", async () => {
    const response = await getVc(
      "customers/userId/accounts/accountId/transactions",
      {
        logClient,
        aggregatorCredentials,
        envConfig: {
          HOSTURL: undefined,
        },
      },
    );

    expect(response).toEqual(sophtronVcTranscationsData);
  });
});
