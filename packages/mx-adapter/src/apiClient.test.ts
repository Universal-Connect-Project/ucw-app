import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { MxProdApiClient } from "./apiClient";
import type { ApiCredentials } from "./models";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock("https-proxy-agent", () => ({
  HttpsProxyAgent: jest.fn(),
}));

const mockAxios = axios as jest.Mocked<typeof axios>;
const MockHttpsProxyAgent = HttpsProxyAgent as jest.MockedClass<
  typeof HttpsProxyAgent
>;

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an API client with proxy configuration when PROXY_HOST is defined", () => {
    const mockAxiosInstance = { test: "axios-instance" };
    const mockProxyAgent = { test: "proxy-agent" };

    mockAxios.create.mockReturnValue(mockAxiosInstance as any);
    MockHttpsProxyAgent.mockImplementation(() => mockProxyAgent as any);

    MxProdApiClient({
      aggregatorCredentials: mockAggregatorCredentials,
      envConfig: mockEnvConfigWithProxy,
    });

    expect(MockHttpsProxyAgent).toHaveBeenCalledWith(
      `http://${mockEnvConfigWithProxy.PROXY_USERNAME}:${mockEnvConfigWithProxy.PROXY_PASSWORD}@${mockEnvConfigWithProxy.PROXY_HOST}:${mockEnvConfigWithProxy.PROXY_PORT}`,
    );

    expect(mockAxios.create).toHaveBeenCalledWith({
      httpsAgent: mockProxyAgent,
    });
  });

  it("creates an API client without proxy configuration when PROXY_HOST is not defined", () => {
    MxProdApiClient({
      aggregatorCredentials: mockAggregatorCredentials,
      envConfig: mockEnvConfigWithoutProxy,
    });

    expect(MockHttpsProxyAgent).not.toHaveBeenCalled();
    expect(mockAxios.create).not.toHaveBeenCalled();
  });
});
