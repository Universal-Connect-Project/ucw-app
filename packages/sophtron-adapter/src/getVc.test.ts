import { createLogClient } from "@repo/utils/test";
import { sophtronTestData } from "@repo/utils-dev-dependency";
import { getVc } from "./getVc";

const { aggregatorCredentials, sophtronVcTranscationsData } = sophtronTestData;

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
