import { http, HttpResponse } from "msw";
import axios from "mx-platform-node/node_modules/axios";
import { getVC } from "./getVc";
import type { AdapterDependencies } from "./models";
import {
  MX_INTEGRATION_VC_GET_ACCOUNTS_PATH,
  MX_VC_GET_ACCOUNTS_PATH,
  MX_VC_GET_TRANSACTIONS_PATH,
} from "@repo/utils-dev-dependency";
import { server } from "./test/testServer";

import { mxTestData, createLogClient } from "@repo/utils-dev-dependency";
import { createClient } from "@repo/utils/test";

const { aggregatorCredentials, mxVcAccountsData, mxVcTranscationsData } =
  mxTestData;

const accountsPath = "users/userId/members/connectionId/accounts";

const dependencies: AdapterDependencies = {
  logClient: createLogClient(),
  cacheClient: createClient(),
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

describe("mx vc", () => {
  describe("MxVcClient", () => {
    it("makes a request with the prod configuration and authorization and returns the verifiable credential", async () => {
      let auth;

      server.use(
        http.get(MX_VC_GET_ACCOUNTS_PATH, ({ request }) => {
          auth = request.headers.get("Authorization");
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData });
        }),
      );

      const response = await getVC(accountsPath, true, dependencies);

      expect(response).toEqual(mxVcAccountsData);

      expect(auth).toEqual(
        "Basic " +
          Buffer.from(
            aggregatorCredentials.mxProd.username +
              ":" +
              aggregatorCredentials.mxProd.password,
          ).toString("base64"),
      );
    });

    it("makes a request with the integration configuration and authorization", async () => {
      let auth;

      server.use(
        http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, ({ request }) => {
          auth = request.headers.get("Authorization");
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData });
        }),
      );

      const response = await getVC(accountsPath, false, dependencies);

      expect(response).toEqual(mxVcAccountsData);

      expect(auth).toEqual(
        "Basic " +
          Buffer.from(
            aggregatorCredentials.mxInt.username +
              ":" +
              aggregatorCredentials.mxInt.password,
          ).toString("base64"),
      );
    });

    it("throws an error on request failure", async () => {
      server.use(
        http.get(
          MX_VC_GET_ACCOUNTS_PATH,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        async () => await getVC(accountsPath, true, dependencies),
      ).rejects.toThrow();
    });

    const mockEnvConfigWithProxy = {
      PROXY_HOST: "fakehost.server.com",
      PROXY_PORT: "8085",
      PROXY_USERNAME: "username",
      PROXY_PASSWORD: "password",
    };

    it("doesn't configure axios proxy when PROXY_HOST is not defined", async () => {
      const axiosCreateSpy = jest.spyOn(axios, "create");

      server.use(
        http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, () => {
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData });
        }),
      );

      const response = await getVC(accountsPath, false, dependencies);

      expect(axiosCreateSpy).not.toHaveBeenCalled();

      expect(response).toEqual(mxVcAccountsData);
    });

    it("configures axios to use proxy server when PROXY_HOST is defined", async () => {
      const axiosCreateSpy = jest.spyOn(axios, "create");

      server.use(
        http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, () => {
          return HttpResponse.json({
            verifiableCredential: mxVcAccountsData,
          });
        }),
      );

      await expect(
        async () =>
          await getVC(accountsPath, true, {
            ...dependencies,
            envConfig: mockEnvConfigWithProxy,
          }),
      ).rejects.toThrow();

      expect(axiosCreateSpy).toHaveBeenCalledWith({
        proxy: {
          host: mockEnvConfigWithProxy.PROXY_HOST,
          port: parseInt(mockEnvConfigWithProxy.PROXY_PORT),
          auth: {
            username: mockEnvConfigWithProxy.PROXY_USERNAME,
            password: mockEnvConfigWithProxy.PROXY_PASSWORD,
          },
        },
      });
    });

    it("includes date range params in transactions request", async () => {
      const startTime = "2021-01-01";
      const endTime = "2025-01-15";
      let requestStartTime: string;
      let requestEndTime: string;

      server.use(
        http.get(MX_VC_GET_TRANSACTIONS_PATH, ({ request }) => {
          const url = new URL(request.url);
          requestStartTime = url.searchParams.get("startTime");
          requestEndTime = url.searchParams.get("endTime");
          return HttpResponse.json({
            verifiableCredential: mxVcTranscationsData,
          });
        }),
      );

      const response = await getVC(
        `users/testUserId/accounts/testAccountId/transactions?startTime=${startTime}&endTime=${endTime}`,
        true,
        dependencies,
      );

      expect(requestStartTime).toEqual(startTime);
      expect(requestEndTime).toEqual(endTime);

      expect(response).toEqual(mxVcTranscationsData);
    });
  });
});
