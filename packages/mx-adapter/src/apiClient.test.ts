import axios from "axios";
import { MxProdApiClient } from "./apiClient";
import type { ApiCredentials } from "./models";

describe("MxProdApiClient", () => {
  const mockAggregatorCredentials: ApiCredentials = {
    clientId: "test-client-id",
    apiKey: "test-api-key",
  };

  const mockEnvConfigWithProxy = {
    PROXY_HOST: "fakehost.server.com",
    PROXY_PORT: "80",
    PROXY_USERNAME: "username",
    PROXY_PASSWORD: "password",
  };

  const mockEnvConfigWithoutProxy = {};

  it("creates an API client with proxy configuration when PROXY_HOST is defined", () => {
    const axiosCreateSpy = jest.spyOn(axios, "create");

    MxProdApiClient({
      aggregatorCredentials: mockAggregatorCredentials,
      envConfig: mockEnvConfigWithProxy,
    });

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

  it("creates an API client without proxy configuration when PROXY_HOST is not defined", () => {
    const axiosCreateSpy = jest.spyOn(axios, "create");

    MxProdApiClient({
      aggregatorCredentials: mockAggregatorCredentials,
      envConfig: mockEnvConfigWithoutProxy,
    });

    expect(axiosCreateSpy).not.toHaveBeenCalled();
  });
});
