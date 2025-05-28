import { createLogClient } from "@repo/utils/test";
import {
  SOPHTRON_VC_GET_TRANSACTIONS_PATH,
  sophtronTestData,
} from "@repo/utils-dev-dependency";
import { getVc } from "./getVc";
import { server } from "./test/testServer";
import { http, HttpResponse } from "msw";

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

  it("includes date range params in request", async () => {
    server.use(
      http.get(SOPHTRON_VC_GET_TRANSACTIONS_PATH, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("startTime")).toBe("2021-01-01");
        expect(url.searchParams.get("endTime")).toBe("2025-01-15");
        return HttpResponse.json({ vc: sophtronVcTranscationsData });
      }),
    );

    const response = await getVc(
      "customers/userId/accounts/accountId/transactions?startTime=2021-01-01&endTime=2025-01-15",
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
