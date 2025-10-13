import { ComboJobTypes } from "@repo/utils";
import { http, HttpResponse } from "msw";
import {
  createPlaidLinkToken,
  getAccounts,
  getAuth,
  getIdentity,
  getItem,
  PLAID_BASE_PATH,
  PLAID_BASE_PATH_PROD,
  publicTokenExchange,
  removeItem,
} from "./apiClient";
import { server } from "./test/testServer";
import {
  plaidTestItemResponse,
  authResponse,
  accountsResponse,
  identityResponse,
} from "@repo/utils-dev-dependency/plaid/testData";

describe("createPlaidLinkToken", () => {
  const userId = "test-user-id";
  const baseParams = {
    sandbox: true,
    clientName: "Test Client",
    clientId: "test-client-id",
    secret: "test-secret",
    userId,
    webhookHostUrl: "https://webhook",
    jobTypes: [],
    state: "abc123",
  };
  const expectedPlaidRequestBody = {
    client_name: "Test Client",
    country_codes: ["US"],
    hosted_link: {
      completion_redirect_uri:
        "https://webhook/oauth/plaid_sandbox/redirect_from?connection_id=abc123",
    },
    language: "en",
    products: [],
    user: {
      client_user_id: userId,
    },
    webhook: "https://webhook/webhook/plaid_sandbox/?connection_id=abc123",
  };
  let receivedBody: unknown;

  beforeEach(() => {
    server.use(
      http.post(`${PLAID_BASE_PATH}/link/token/create`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          expiration: "2025-06-23T12:54:37Z",
          link_token: "link-sandbox-9791370e-9f28-401e-af44-96031b21d98d",
          request_id: "DtPD4pznLCMKZ48",
          hosted_link_url: PLAID_BASE_PATH,
        });
      }),
    );
  });

  it("calls Plaid sandbox endpoint with expected request body and returns PlaidToken", async () => {
    const result = await createPlaidLinkToken(baseParams);

    expect(result.link_token).toMatch(/^link-sandbox-/);
    expect(result.hosted_link_url).toBe(PLAID_BASE_PATH);
    expect(result.request_id).toBeDefined();
    expect(result.expiration).toBeDefined();
    expect(receivedBody).toEqual(expectedPlaidRequestBody);
  });

  it("calls Plaid production endpoint when sandbox is false", async () => {
    const result = await createPlaidLinkToken({
      ...baseParams,
      sandbox: false,
    });

    expect(result.link_token).toMatch(/^link-production-/);
    expect(result.hosted_link_url).toBe(PLAID_BASE_PATH_PROD);
    expect(result.request_id).toBeDefined();
    expect(result.expiration).toBeDefined();
    expect(receivedBody).toEqual(expectedPlaidRequestBody);
  });

  it("includes transactions with 730 days if TRANSACTION_HISTORY is present", async () => {
    const result = await createPlaidLinkToken({
      ...baseParams,
      jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
    });

    expect(result.link_token).toMatch(/^link-sandbox-/);
    expect(result.hosted_link_url).toBe(PLAID_BASE_PATH);
    expect(receivedBody).toEqual({
      ...expectedPlaidRequestBody,
      products: ["transactions"],
      transactions: {
        days_requested: 730,
      },
    });
  });

  it("includes transactions with 90 days if TRANSACTIONS is present", async () => {
    const result = await createPlaidLinkToken({
      ...baseParams,
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    });

    expect(result.link_token).toMatch(/^link-sandbox-/);
    expect(result.hosted_link_url).toBe(PLAID_BASE_PATH);
    expect(receivedBody).toEqual({
      ...expectedPlaidRequestBody,
      products: ["transactions"],
      transactions: {
        days_requested: 90,
      },
    });
  });

  it("includes identity if ACCOUNT_OWNER is present", async () => {
    const result = await createPlaidLinkToken({
      ...baseParams,
      jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
    });

    expect(result.link_token).toMatch(/^link-sandbox-/);
    expect(result.hosted_link_url).toBe(PLAID_BASE_PATH);
    expect(receivedBody).toEqual({
      ...expectedPlaidRequestBody,
      products: ["identity"],
    });
  });

  it("includes auth if ACCOUNT_NUMBER is present", async () => {
    const result = await createPlaidLinkToken({
      ...baseParams,
      jobTypes: [ComboJobTypes.ACCOUNT_NUMBER],
    });

    expect(result.link_token).toMatch(/^link-sandbox-/);
    expect(result.hosted_link_url).toBe(PLAID_BASE_PATH);
    expect(receivedBody).toEqual({
      ...expectedPlaidRequestBody,
      products: ["auth"],
    });
  });
});

describe("publicTokenExchange", () => {
  const clientId = "test-client-id";
  const secret = "test-secret";
  const publicToken = "public-sample-token";

  it("exchanges public token with expected request body and headers in sandbox env", async () => {
    const expectedRequestBody = {
      client_id: clientId,
      secret,
      public_token: publicToken,
    };
    let receivedBody: unknown;
    let hitSandbox: boolean;

    server.use(
      http.post(
        `${PLAID_BASE_PATH}/item/public_token/exchange`,
        async ({ request }) => {
          hitSandbox = true;
          receivedBody = await request.json();
          return HttpResponse.json({
            access_token: "access-sample-token",
            item_id: "item-sample-id",
          });
        },
      ),
    );

    const result = await publicTokenExchange({
      publicToken,
      clientId,
      secret,
      sandbox: true,
    });

    expect(result).toEqual({
      access_token: "access-sample-token",
      item_id: "item-sample-id",
    });
    expect(receivedBody).toEqual(expectedRequestBody);
    expect(hitSandbox).toBe(true);
  });

  it("exchanges public token in production env", async () => {
    let hitProductionEnv: boolean;

    server.use(
      http.post(
        `${PLAID_BASE_PATH_PROD}/item/public_token/exchange`,
        async () => {
          hitProductionEnv = true;
          return HttpResponse.json({});
        },
      ),
    );

    await publicTokenExchange({
      publicToken,
      clientId,
      secret,
      sandbox: false,
    });

    expect(hitProductionEnv).toBe(true);
  });

  it("throws an error if response is not ok", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/item/public_token/exchange`,
        () => new HttpResponse("Unauthorized", { status: 401 }),
      ),
    );

    await expect(
      publicTokenExchange({
        publicToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Error exchanging public token");
  });
});

describe("removeItem", () => {
  const clientId = "test-client-id";
  const secret = "test-secret";
  const accessToken = "access-sample-token";

  it("removes item with expected request body and headers in sandbox env", async () => {
    const expectedRequestBody = {
      client_id: clientId,
      secret,
      access_token: accessToken,
    };
    let receivedBody: unknown;
    let hitSandbox: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH}/item/remove`, async ({ request }) => {
        hitSandbox = true;
        receivedBody = await request.json();
        return HttpResponse.json({ removed: true });
      }),
    );

    const result = await removeItem({
      accessToken,
      clientId,
      secret,
      sandbox: true,
    });

    expect(result).toEqual({
      status: 200,
      data: { removed: true },
    });
    expect(receivedBody).toEqual(expectedRequestBody);
    expect(hitSandbox).toBe(true);
  });

  it("removes item in production env", async () => {
    let hitProductionEnv: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH_PROD}/item/remove`, async () => {
        hitProductionEnv = true;
        return HttpResponse.json({ removed: true });
      }),
    );

    const result = await removeItem({
      accessToken,
      clientId,
      secret,
      sandbox: false,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ removed: true });
    expect(hitProductionEnv).toBe(true);
  });

  it("throws an error if response is not ok and includes error message", async () => {
    server.use(
      http.post(`${PLAID_BASE_PATH}/item/remove`, () =>
        HttpResponse.json({ error_message: "Plaid error!" }, { status: 400 }),
      ),
    );

    await expect(
      removeItem({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Plaid error!");
  });

  it("throws a generic error if response is not ok and no error message is present", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/item/remove`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(
      removeItem({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Error removing Item");
  });
});

describe("getItem", () => {
  const clientId = "test-client-id";
  const secret = "test-secret";
  const accessToken = "access-sample-token";

  it("gets item with expected request body and headers in sandbox env", async () => {
    const expectedRequestBody = {
      client_id: clientId,
      secret,
      access_token: accessToken,
    };
    let receivedBody: unknown;
    let hitSandbox: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH}/item/get`, async ({ request }) => {
        hitSandbox = true;
        receivedBody = await request.json();
        return HttpResponse.json(plaidTestItemResponse);
      }),
    );

    const result = await getItem({
      accessToken,
      clientId,
      secret,
      sandbox: true,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(plaidTestItemResponse);
    expect(receivedBody).toEqual(expectedRequestBody);
    expect(hitSandbox).toBe(true);
  });

  it("gets item in production env", async () => {
    let hitProductionEnv: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH_PROD}/item/get`, async () => {
        hitProductionEnv = true;
        return HttpResponse.json(plaidTestItemResponse);
      }),
    );

    const result = await getItem({
      accessToken,
      clientId,
      secret,
      sandbox: false,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(plaidTestItemResponse);
    expect(hitProductionEnv).toBe(true);
  });

  it("throws an error if response is not ok and includes error message", async () => {
    server.use(
      http.post(`${PLAID_BASE_PATH}/item/get`, () =>
        HttpResponse.json(
          { error_message: "Item not found!" },
          { status: 404 },
        ),
      ),
    );

    await expect(
      getItem({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Item not found!");
  });
});

describe("getAuth", () => {
  const clientId = "test-client-id";
  const secret = "test-secret";
  const accessToken = "access-sample-token";

  it("gets auth data with expected request body and headers in sandbox env", async () => {
    const expectedRequestBody = {
      client_id: clientId,
      secret,
      access_token: accessToken,
    };
    let receivedBody: unknown;
    let hitSandbox: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH}/auth/get`, async ({ request }) => {
        hitSandbox = true;
        receivedBody = await request.json();
        return HttpResponse.json(authResponse);
      }),
    );

    const result = await getAuth({
      accessToken,
      clientId,
      secret,
      sandbox: true,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(authResponse);
    expect(receivedBody).toEqual(expectedRequestBody);
    expect(hitSandbox).toBe(true);
  });

  it("gets auth data in production env", async () => {
    let hitProductionEnv: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH_PROD}/auth/get`, async () => {
        hitProductionEnv = true;
        return HttpResponse.json(authResponse);
      }),
    );

    const result = await getAuth({
      accessToken,
      clientId,
      secret,
      sandbox: false,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(authResponse);
    expect(hitProductionEnv).toBe(true);
  });

  it("throws an error if response is not ok and includes error message", async () => {
    server.use(
      http.post(`${PLAID_BASE_PATH}/auth/get`, () =>
        HttpResponse.json(
          { error_message: "Invalid access token!" },
          { status: 400 },
        ),
      ),
    );

    await expect(
      getAuth({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Invalid access token!");
  });

  it("throws a generic error if response is not ok and no error message is present", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/auth/get`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(
      getAuth({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Error getting account numbers");
  });
});

describe("getAccounts", () => {
  const clientId = "test-client-id";
  const secret = "test-secret";
  const accessToken = "access-sample-token";

  it("gets accounts data with expected request body and headers in sandbox env", async () => {
    const expectedRequestBody = {
      client_id: clientId,
      secret,
      access_token: accessToken,
    };
    let receivedBody: unknown;
    let hitSandbox: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH}/accounts/get`, async ({ request }) => {
        hitSandbox = true;
        receivedBody = await request.json();
        return HttpResponse.json(accountsResponse);
      }),
    );

    const result = await getAccounts({
      accessToken,
      clientId,
      secret,
      sandbox: true,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(accountsResponse);
    expect(result.data.accounts).toHaveLength(12);
    expect(receivedBody).toEqual(expectedRequestBody);
    expect(hitSandbox).toBe(true);
  });

  it("gets accounts data in production env", async () => {
    let hitProductionEnv: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH_PROD}/accounts/get`, async () => {
        hitProductionEnv = true;
        return HttpResponse.json(accountsResponse);
      }),
    );

    const result = await getAccounts({
      accessToken,
      clientId,
      secret,
      sandbox: false,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(accountsResponse);
    expect(hitProductionEnv).toBe(true);
  });

  it("throws an error if response is not ok and includes error message", async () => {
    server.use(
      http.post(`${PLAID_BASE_PATH}/accounts/get`, () =>
        HttpResponse.json(
          { error_message: "Invalid access token for accounts!" },
          { status: 400 },
        ),
      ),
    );

    await expect(
      getAccounts({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Invalid access token for accounts!");
  });

  it("throws a generic error if response is not ok and no error message is present", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/accounts/get`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(
      getAccounts({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Error getting accounts");
  });

  it("throws an error if response is ok but contains invalid JSON", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/accounts/get`,
        () =>
          new HttpResponse("invalid json content", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(
      getAccounts({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow(
      "Response was successful but contained invalid JSON. Error getting accounts",
    );
  });
});

describe("getIdentity", () => {
  const clientId = "test-client-id";
  const secret = "test-secret";
  const accessToken = "access-sample-token";

  it("gets identity data with expected request body and headers in sandbox env", async () => {
    const expectedRequestBody = {
      client_id: clientId,
      secret,
      access_token: accessToken,
    };
    let receivedBody: unknown;
    let hitSandbox: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH}/identity/get`, async ({ request }) => {
        hitSandbox = true;
        receivedBody = await request.json();
        return HttpResponse.json(identityResponse);
      }),
    );

    const result = await getIdentity({
      accessToken,
      clientId,
      secret,
      sandbox: true,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(identityResponse);
    expect(result.data.accounts).toHaveLength(12);
    expect(receivedBody).toEqual(expectedRequestBody);
    expect(hitSandbox).toBe(true);
  });

  it("gets identity data in production env", async () => {
    let hitProductionEnv: boolean;

    server.use(
      http.post(`${PLAID_BASE_PATH_PROD}/identity/get`, async () => {
        hitProductionEnv = true;
        return HttpResponse.json(identityResponse);
      }),
    );

    const result = await getIdentity({
      accessToken,
      clientId,
      secret,
      sandbox: false,
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual(identityResponse);
    expect(hitProductionEnv).toBe(true);
  });

  it("throws an error if response is not ok and includes error message", async () => {
    server.use(
      http.post(`${PLAID_BASE_PATH}/identity/get`, () =>
        HttpResponse.json(
          { error_message: "Invalid access token for identity!" },
          { status: 400 },
        ),
      ),
    );

    await expect(
      getIdentity({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Invalid access token for identity!");
  });

  it("throws a generic error if response is not ok and no error message is present", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/identity/get`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(
      getIdentity({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow("Error getting identity");
  });

  it("throws an error if response is ok but contains invalid JSON", async () => {
    server.use(
      http.post(
        `${PLAID_BASE_PATH}/identity/get`,
        () =>
          new HttpResponse("invalid json content", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(
      getIdentity({
        accessToken,
        clientId,
        secret,
        sandbox: true,
      }),
    ).rejects.toThrow(
      "Response was successful but contained invalid JSON. Error getting identity",
    );
  });
});
