import "dotenv/config";

import {
  createClient as createCacheClient,
  createMockPerformanceClient,
} from "@repo/utils/test";
import { createLogClient } from "@repo/utils-dev-dependency";
import { plaidTestItemResponse } from "@repo/utils-dev-dependency/plaid/testData/items";
import { PlaidAdapter } from "./adapter";
import { ComboJobTypes, Connection, ConnectionStatus } from "@repo/utils";
import { PLAID_BASE_PATH, PLAID_BASE_PATH_PROD } from "./apiClient";
import { server } from "./test/testServer";
import { http, HttpResponse } from "msw";

const cacheClient = createCacheClient();
const logClient = createLogClient();

jest.mock("uuid", () => ({ v4: () => "123456789" }));

const aggregatorCredentials = {
  plaidSandbox: {
    clientName: "test-clientName",
    clientId: "test-clientId",
    secret: "test-app-secret",
  },
  plaidProd: {
    clientName: "prod-test-clientName",
    clientId: "prod-test-clientId",
    secret: "prod-test-app-secret",
  },
};

const mockPerformanceClient = createMockPerformanceClient();

const UcpIdFromAggCode = "testUcpId";
const plaidAdapterSandbox = new PlaidAdapter({
  sandbox: true,
  dependencies: {
    cacheClient,
    logClient,
    performanceClient: mockPerformanceClient,
    aggregatorCredentials,
    getWebhookHostUrl: () => "testWebhookHostUrl",
    getUcpIdFromAggregatorInstitutionCode: async () => UcpIdFromAggCode,
    envConfig: {
      HostUrl: "http://localhost:8080",
    },
  },
});

const plaidAdapter = new PlaidAdapter({
  sandbox: false,
  dependencies: {
    cacheClient,
    performanceClient: mockPerformanceClient,
    logClient,
    aggregatorCredentials,
    getWebhookHostUrl: () => "testWebhookHostUrl",
    getUcpIdFromAggregatorInstitutionCode: async () => UcpIdFromAggCode,
    envConfig: {
      HostUrl: "http://localhost:8080",
    },
  },
});

describe("plaid aggregator", () => {
  describe("shouldRecordPerformanceDuration", () => {
    it("returns false", () => {
      expect(plaidAdapterSandbox.shouldRecordPerformanceDuration).toBe(false);
    });
  });

  describe("GetInsitutionById", () => {
    it("Maps correct fields", async () => {
      const ret = await plaidAdapterSandbox.GetInstitutionById("testId");
      expect(ret).toEqual({
        id: "testId",
        aggregator: "plaid_sandbox",
        supportsOauth: true,
      });
    });
  });

  describe("ListInstitutionCredentials", () => {
    it("transforms the credentials into useable form, not available with plaid atm", async () => {
      expect(await plaidAdapter.ListInstitutionCredentials("testId")).toEqual(
        [],
      );
    });
  });

  describe("ListConnectionCredentials", () => {
    it("retreieves and transforms member credentials, not available with plaid atm", async () => {
      expect(
        await plaidAdapter.ListConnectionCredentials(
          "testMemberId",
          "test-user-name",
        ),
      ).toEqual([]);
    });
  });

  describe("ListConnections", () => {
    it("retrieves and transforms the members, not available with plaid atm", async () => {
      expect(await plaidAdapter.ListConnections("testId")).toEqual([]);
    });
  });

  describe("CreateConnection, getConnectionById, GetConnectionStatus", () => {
    const baseConnectionRequest = {
      credentials: [],
      institutionId: "testInstitutionId",
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    };
    const testUserId = "test-user-id";

    it("creates a connection and gets the connection by id then gets the status", async () => {
      const connection = await plaidAdapter.CreateConnection(
        {
          ...baseConnectionRequest,
          is_oauth: true,
        },
        testUserId,
      );
      const connectionId = connection.id;

      const expectedConnectionObj = {
        id: connectionId,
        institution_code: "testInstitutionId",
        is_oauth: true,
        oauth_window_uri: PLAID_BASE_PATH_PROD,
        aggregator: "plaid",
        credentials: [],
        status: ConnectionStatus.CREATED,
        userId: testUserId,
      };

      expect(connection).toEqual(expectedConnectionObj);

      const connectionById = await plaidAdapter.GetConnectionById(connectionId);
      expect(connectionById).toEqual(expectedConnectionObj);

      const connectionStatus = await plaidAdapter.GetConnectionStatus(
        connectionId,
        "",
      );

      expect(connectionStatus.status).toEqual(ConnectionStatus.PENDING);
    });
  });

  describe("ResolveUserId", () => {
    it("returns the user_id from parameter", async () => {
      const returnedUserId = await plaidAdapter.ResolveUserId("user_id");

      expect(returnedUserId).toEqual("user_id");
    });
  });

  describe("DeleteConnection", () => {
    it("deletes the connection", async () => {
      let plaidItemRemoveEndpointCalled = false;
      server.use(
        http.post(`${PLAID_BASE_PATH_PROD}/item/remove`, async () => {
          plaidItemRemoveEndpointCalled = true;
          return HttpResponse.json({});
        }),
      );

      await plaidAdapter.DeleteConnection("testId");
      const cached = await cacheClient.get("testId");
      expect(cached).toBe(null);
      expect(plaidItemRemoveEndpointCalled).toBe(true);
    });
  });

  describe("DeleteUser", () => {
    it("throws an error for plaid", async () => {
      await expect(plaidAdapter.DeleteUser("test-user-name")).rejects.toThrow(
        "Plaid doesn't support user deletion, you must delete connections instead",
      );
    });
  });

  describe("UpdateConnection", () => {
    it("is not available with plaid", async () => {
      const ret = await plaidAdapter.UpdateConnection(null);
      expect(ret).toEqual(undefined);
    });
  });

  describe("HandleOauthResponse", () => {
    beforeEach(() => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/item/get`, () => {
          return HttpResponse.json(plaidTestItemResponse);
        }),
        http.post(`${PLAID_BASE_PATH_PROD}/item/get`, () => {
          return HttpResponse.json(plaidTestItemResponse);
        }),
      );
    });

    it("returns the updated connection and records performance success event when UCP ID matches", async () => {
      const requestId = "abc123";
      const connection: Connection = {
        id: requestId,
        status: ConnectionStatus.PENDING,
        institution_code: "inst-001",
        userId: null,
      };

      await cacheClient.set(requestId, connection);
      await cacheClient.set(`context_${requestId}`, {
        ucpInstitutionId: UcpIdFromAggCode,
      });

      const result = await plaidAdapter.HandleOauthResponse({
        query: {
          connection_id: requestId,
        },
        body: {
          webhook_code: "ITEM_ADD_RESULT",
          public_token: "fake_public_token",
          link_session_id: "link_session_id",
        },
      });

      expect(result).toEqual({
        status: ConnectionStatus.CONNECTED,
        institution_code: "inst-001",
        id: "accessTokenTest",
        postMessageEventData: {
          memberConnected: {
            connectionId: "accessTokenTest",
          },
          memberStatusUpdate: {
            connectionId: "accessTokenTest",
          },
        },
        userId: null,
      });

      const cached = await cacheClient.get(requestId);
      expect(cached).toEqual(result);
      expect(
        mockPerformanceClient.recordConnectionPauseEvent,
      ).toHaveBeenCalledWith(requestId);

      expect(mockPerformanceClient.recordSuccessEvent).toHaveBeenCalledWith(
        requestId,
        "accessTokenTest",
      );
    });

    it("returns the updated connection but doesn't record performance success event when UCP ID doesn't match", async () => {
      const requestId = "abc123";
      const connection: Connection = {
        id: requestId,
        status: ConnectionStatus.PENDING,
        institution_code: "inst-001",
        userId: null,
      };

      await cacheClient.set(requestId, connection);
      await cacheClient.set(`context_${requestId}`, {
        ucpInstitutionId: "somethingDifferent",
      });

      const result = await plaidAdapter.HandleOauthResponse({
        query: {
          connection_id: requestId,
        },
        body: {
          webhook_code: "ITEM_ADD_RESULT",
          public_token: "fake_public_token",
          link_session_id: "link_session_id",
        },
      });

      expect(result).toEqual({
        status: ConnectionStatus.CONNECTED,
        institution_code: "inst-001",
        id: "accessTokenTest",
        postMessageEventData: {
          memberConnected: {
            connectionId: "accessTokenTest",
          },
          memberStatusUpdate: {
            connectionId: "accessTokenTest",
          },
        },
        userId: null,
      });

      const cached = await cacheClient.get(requestId);
      expect(cached).toEqual(result);
      expect(
        mockPerformanceClient.recordConnectionPauseEvent,
      ).toHaveBeenCalledWith(requestId);
      expect(mockPerformanceClient.recordSuccessEvent).not.toHaveBeenCalled();
    });

    it("handles getUcpIdFromAggregatorInstitutionCode returning null", async () => {
      const plaidAdapterWithNullUcp = new PlaidAdapter({
        sandbox: false,
        dependencies: {
          cacheClient,
          performanceClient: mockPerformanceClient,
          logClient,
          aggregatorCredentials,
          getWebhookHostUrl: () => "testWebhookHostUrl",
          getUcpIdFromAggregatorInstitutionCode: async () => null,
          envConfig: {
            HostUrl: "http://localhost:8080",
          },
        },
      });

      const requestId = "abc123";
      const connection: Connection = {
        id: requestId,
        status: ConnectionStatus.PENDING,
        institution_code: "inst-001",
        userId: null,
      };

      await cacheClient.set(requestId, connection);
      await cacheClient.set(`context_${requestId}`, {
        ucpInstitutionId: UcpIdFromAggCode,
      });

      const result = await plaidAdapterWithNullUcp.HandleOauthResponse({
        query: {
          connection_id: requestId,
        },
        body: {
          webhook_code: "ITEM_ADD_RESULT",
          public_token: "fake_public_token",
          link_session_id: "link_session_id",
        },
      });

      expect(result).toEqual({
        status: ConnectionStatus.CONNECTED,
        institution_code: "inst-001",
        id: "accessTokenTest",
        postMessageEventData: {
          memberConnected: {
            connectionId: "accessTokenTest",
          },
          memberStatusUpdate: {
            connectionId: "accessTokenTest",
          },
        },
        userId: null,
      });

      expect(
        mockPerformanceClient.recordConnectionPauseEvent,
      ).toHaveBeenCalledWith(requestId);
      expect(mockPerformanceClient.recordSuccessEvent).not.toHaveBeenCalled();
    });

    it("throws if connection not found in cache", async () => {
      const request = {
        query: {
          connection_id: "junk",
          state: "nonexistent",
          code: "code123",
        },
        body: {},
      };

      await expect(plaidAdapter.HandleOauthResponse(request)).rejects.toThrow(
        "Connection not found",
      );
    });

    it("Logs info and returns the connection if EVENTS webhook is received", async () => {
      const requestId = "abc123";
      await cacheClient.set(requestId, {});

      const result = await plaidAdapter.HandleOauthResponse({
        query: {
          connection_id: requestId,
        },
        body: {
          environment: "sandbox",
          link_session_id: "1daca4d5-9a0d-4e85-a2e9-1e905ecaa32e",
          link_token: "link-sandbox-79e723b0-0e04-4248-8a33-15ceb6828a45",
          webhook_code: "EVENTS",
          webhook_type: "LINK",
          events: [
            {
              event_id: "978b772c-f2cc-404f-9449-2113e4671c4f",
              event_metadata: {
                error_code: "INVALID_CREDENTIALS",
                error_message: "the provided credentials were not correct",
                error_type: "ITEM_ERROR",
                exit_status: "requires_credentials",
                institution_id: "ins_20",
                institution_name: "Citizens Bank",
                request_id: "u1HcAeiCKtz3qmm",
              },
              event_name: "EXIT",
              timestamp: "2024-05-21T00:18:13Z",
            },
          ],
        },
      });

      expect(logClient.info).toHaveBeenCalled();

      const cachedConnection = (await cacheClient.get(requestId)) as {
        status: string;
      };
      expect(result).toEqual(cachedConnection);
    });
  });
});
