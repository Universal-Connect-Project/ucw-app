import { HttpResponse, http } from "msw";
import 'dotenv/config'

import {
  MX_INTEGRATION_VC_GET_ACCOUNTS_PATH,
  MX_VC_GET_ACCOUNTS_PATH
} from "./test/handlers";
import { mxVcAccountsData } from "./test/testData/mxVcData";
import { server } from "./test/testServer";

import { logClient } from "./test/utils/logClient";

import { getVC } from "./getVc";
import type { AdapterDependencies } from "./models";
import { aggregatorCredentials, cacheClient } from "./adapter.test";

const accountsPath = "users/userId/members/connectionId/accounts";

const dependencies: AdapterDependencies = {
  logClient,
  cacheClient,
  aggregatorCredentials,
  envConfig: process.env
};

describe("mx vc", () => {
  describe("MxVcClient", () => {
    it("makes a request with the prod configuration and authorization and returns the verifiable credential", async () => {
      let auth;

      server.use(
        http.get(MX_VC_GET_ACCOUNTS_PATH, ({ request }) => {
          auth = request.headers.get("Authorization");
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData });
        })
      );

      const response = await getVC(accountsPath, true, dependencies);

      expect(response).toEqual(mxVcAccountsData);

      expect(auth).toEqual(
        "Basic " +
        Buffer.from(
          aggregatorCredentials.mxProd.username +
          ":" +
          aggregatorCredentials.mxProd.password
        ).toString("base64")
      );
    });

    it("makes a request with the integration configuration and authorization", async () => {
      let auth;

      server.use(
        http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, ({ request }) => {
          auth = request.headers.get("Authorization");
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData });
        })
      );

      const response = await getVC(accountsPath, false, dependencies);

      expect(response).toEqual(mxVcAccountsData);

      expect(auth).toEqual(
        "Basic " +
        Buffer.from(
          aggregatorCredentials.mxInt.username +
          ":" +
          aggregatorCredentials.mxInt.password
        ).toString("base64")
      );
    });

    it("throws an error on request failure", async () => {
      server.use(
        http.get(
          MX_VC_GET_ACCOUNTS_PATH,
          () => new HttpResponse(null, { status: 400 })
        )
      );

      await expect(
        async () => await getVC(accountsPath, true, dependencies)
      ).rejects.toThrow();
    });
  });
});
