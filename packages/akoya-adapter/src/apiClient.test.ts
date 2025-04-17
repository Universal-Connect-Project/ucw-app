import {
  createGetOauthUrl,
  AKOYA_BASE_PATH,
  AKOYA_BASE_PROD_PATH,
} from "./apiClient";

describe("createGetOauthUrl", () => {
  const commonParams = {
    clientId: "test-client-id",
    hostUrl: "http://localhost:8080",
    institutionId: "inst_123",
    state: "abc123",
  };

  it("should return a valid OAuth URL for sandbox environment", () => {
    const url = new URL(createGetOauthUrl({ ...commonParams, sandbox: true }));

    expect(url.origin).toBe(AKOYA_BASE_PATH);
    expect(url.pathname).toBe("/auth");

    const search = url.searchParams;
    expect(search.get("connector")).toBe(commonParams.institutionId);
    expect(search.get("client_id")).toBe(commonParams.clientId);
    expect(search.get("redirect_uri")).toBe(
      `${commonParams.hostUrl}/oauth/akoya_sandbox/redirect_from`,
    );
    expect(search.get("state")).toBe(commonParams.state);
    expect(search.get("response_type")).toBe("code");
    expect(search.get("scope")).toBe("openid profile offline_access");
  });

  it("should return a valid OAuth URL for production environment", () => {
    const url = new URL(createGetOauthUrl({ ...commonParams, sandbox: false }));

    expect(url.origin).toBe(AKOYA_BASE_PROD_PATH);
    expect(url.pathname).toBe("/auth");

    const search = url.searchParams;
    expect(search.get("redirect_uri")).toBe(
      `${commonParams.hostUrl}/oauth/akoya/redirect_from`,
    );
  });
});
