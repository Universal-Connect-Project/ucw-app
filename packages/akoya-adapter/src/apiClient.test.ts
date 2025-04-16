import AkoyaClient, {
  AKOYA_BASE_PATH,
  AKOYA_BASE_PROD_PATH,
} from "./apiClient";

describe("AkoyaClient", () => {
  const sandboxCredentials = {
    clientId: "sandbox-client-id",
    secret: "sandbox-secret",
  };

  const prodCredentials = {
    clientId: "prod-client-id",
    secret: "prod-secret",
  };

  const loggerMock = {
    trace: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
  };

  const envConfig = {
    HostUrl: "http://localhost:8080",
  };

  describe("constructor", () => {
    it("should initialize with sandbox config", () => {
      const client = new AkoyaClient(
        true,
        sandboxCredentials,
        loggerMock,
        envConfig,
      );

      expect(client.apiConfig).toEqual({
        ...sandboxCredentials,
        basePath: AKOYA_BASE_PATH,
        apiVersion: "v2",
        aggregator: "akoya_sandbox",
      });

      expect(client.client_redirect_url).toBe(
        "http://localhost:8080/oauth/akoya_sandbox/redirect_from",
      );

      expect(client.authParams).toEqual({
        client_id: sandboxCredentials.clientId,
        client_secret: sandboxCredentials.secret,
      });
    });

    it("should initialize with production config", () => {
      const client = new AkoyaClient(
        false,
        prodCredentials,
        loggerMock,
        envConfig,
      );

      expect(client.authParams).toEqual({
        client_id: prodCredentials.clientId,
        client_secret: prodCredentials.secret,
      });
      expect(client.apiConfig.basePath).toBe(AKOYA_BASE_PROD_PATH);
      expect(client.apiConfig.aggregator).toBe("akoya");
      expect(client.client_redirect_url).toBe(
        "http://localhost:8080/oauth/akoya/redirect_from",
      );
    });
  });

  describe("getOauthUrl", () => {
    it("should return a valid OAuth URL with the correct query params", () => {
      const client = new AkoyaClient(
        true,
        sandboxCredentials,
        loggerMock,
        envConfig,
      );

      const institutionId = "inst_abc";
      const state = "xyz123";

      const url = new URL(client.getOauthUrl(institutionId, state));
      expect(url.origin).toBe(AKOYA_BASE_PATH);
      expect(url.pathname).toBe("/auth");

      const params = url.searchParams;
      expect(params.get("connector")).toBe(institutionId);
      expect(params.get("client_id")).toBe(sandboxCredentials.clientId);
      expect(params.get("redirect_uri")).toBe(client.client_redirect_url);
      expect(params.get("state")).toBe(state);
      expect(params.get("response_type")).toBe("code");
      expect(params.get("scope")).toBe("openid profile offline_access");
    });
  });
});
