import { http, HttpResponse } from "msw";

import {
  createClient as createCacheClient,
  createMockPerformanceClient,
} from "@repo/utils/test";
import { FlinksAdapter } from "./adapter";
import {
  ComboJobTypes,
  ConnectionStatus,
  PerformanceClient,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";
import { createLogClient } from "@repo/utils-dev-dependency";

import { server } from "./test/testServer";

import {
  DELETE_USER_PATH,
  FLINKS_HISTORIC_TRANSACTIONS_PATH,
  MOCKED_FIX_OAUTH_URL,
  MOCKED_OAUTH_URL,
} from "./test/handlers";
import { BASE_PATH } from "./apiClient";
import { accountsData } from "./test/testData/accounts";

export const cacheClient = createCacheClient();

export const aggregatorCredentials = {
  flinksSandbox: {
    instannce: "",
    customerId: "",
    apiKey: "prodAppKey",
    aggregator: "flinks_sandbox",
    available: true,
  },
  flinks: {
    instannce: "",
    customerId: "",
    apiKey: "prodAppKey",
    aggregator: "flinks",
    available: true,
  },
};

describe("flinks aggregator", () => {
  let flinksAdapterSandbox: FlinksAdapter;
  let flinksAdapter: FlinksAdapter;
  let mockPerformanceClient: PerformanceClient;

  beforeEach(() => {
    mockPerformanceClient = createMockPerformanceClient();

    flinksAdapterSandbox = new FlinksAdapter({
      sandbox: true,
      sessionId: "test-session",
      dependencies: {
        cacheClient,
        logClient: createLogClient(),
        performanceClient: mockPerformanceClient,
        aggregatorCredentials,
        getWebhookHostUrl: () => "testWebhookHostUrl",
        envConfig: {
          HostUrl: "http://test.universalconnect.org",
        },
      },
    });

    flinksAdapter = new FlinksAdapter({
      sandbox: false,
      sessionId: "test-session",
      dependencies: {
        cacheClient,
        logClient: createLogClient(),
        performanceClient: mockPerformanceClient,
        aggregatorCredentials,
        getWebhookHostUrl: () => "testWebhookHostUrl",
        envConfig: {
          HostUrl: "http://test.universalconnect.org",
        },
      },
    });
  });

  describe("requiresPollingForPerformance", () => {
    it("returns false", () => {
      expect(flinksAdapterSandbox.requiresPollingForPerformance).toBe(false);
      expect(flinksAdapter.requiresPollingForPerformance).toBe(false);
    });
  });

  describe("GetInsitutionById", () => {
    it("Maps correct fields", async () => {
      const testInstitutionId = "testId";
      const institution =
        await flinksAdapterSandbox.GetInstitutionById(testInstitutionId);
      expect(institution).toEqual({
        id: testInstitutionId,
        supportsOauth: true,
      });
    });
  });

  describe("ListInstitutionCredentials", () => {
    it("does nothing for Flinks", async () => {
      expect(
        await flinksAdapter.ListInstitutionCredentials("testId"),
      ).toEqual([]);
    });
  });

  describe("ListConnections", () => {
    it("retrieves and transforms the members, not available with flinks atm", async () => {
      expect(await flinksAdapter.ListConnections("testId")).toEqual([]);
    });
  });

  describe("ListConnectionCredentials", () => {
    it("retreieves and transforms member credentials, not available with flinks atm", async () => {
      expect(
        await flinksAdapter.ListConnectionCredentials(
          "testMemberId",
          "test-user-name",
        ),
      ).toEqual([]);
    });
  });

  describe("CreateConnection, GetConnectionById, GetConnectionStatus, DeleteConnection", () => {
    const testInstitutionId = "testInstitutionId";
    const baseConnectionRequest = {
      institutionId: testInstitutionId,
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      credentials: [],
    };
    const testUserId = "test-user-id";
    const expectedConnectionObject = {
      institution_code: testInstitutionId,
      is_oauth: true,
      userId: testUserId,
      oauth_window_uri: MOCKED_OAUTH_URL,
      aggregator: "flinks",
      status: ConnectionStatus.CREATED,
    };

    it("creates a connection then gets connection by Id then gets connection then deletes a connection", async () => {
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          ...baseConnectionRequest,
        },
        testUserId,
      );
      let userDeletionAttempted = false;

      server.use(
        http.delete(DELETE_USER_PATH, ({ params }) => {
          userDeletionAttempted = true;
          expect(params.customerId).toBe(testUserId);

          return new HttpResponse(null, {
            status: 204,
          });
        }),
      );

      expect(createdConnection).toEqual(
        expect.objectContaining(expectedConnectionObject),
      );

      const connectionById = await flinksAdapter.GetConnectionById(
        createdConnection.id,
      );
      expect(connectionById).toEqual(
        expect.objectContaining(expectedConnectionObject),
      );

      const connectionStatus = await flinksAdapter.GetConnectionStatus(
        connectionById.id,
      );
      expect(connectionStatus).toEqual(
        expect.objectContaining({
          ...expectedConnectionObject,
          status: ConnectionStatus.PENDING,
        }),
      );

      const response = await flinksAdapter.DeleteConnection(
        connectionById.id,
        testUserId,
      );
      expect(response).toEqual({
        status: 200,
        data: { message: "Connection deleted successfully" },
      });

      const connectionByIdAfterDelete = await flinksAdapter.GetConnectionById(
        createdConnection.id,
      );

      expect(connectionByIdAfterDelete).toBeUndefined();
      expect(userDeletionAttempted).toBe(true);
    });
  });

  describe("CreateConnection when refreshing", () => {
    it("generates a connect fix url for the oauth_window_uri", async () => {
      const connectionId = "testConnectionId";
      const institutionId = "testInstitutionId";
      const request = {
        id: connectionId,
        institution_code: "junk",
        credentials: [],
        institutionId,
        performanceSessionId: connectionId,
      };
      const userId = "testUserId";
      const connection = await flinksAdapter.CreateConnection(
        request,
        userId,
      );
      expect(connection).toEqual({
        aggregator: "flinks",
        credentials: [],
        id: expect.any(String),
        institution_code: institutionId,
        is_oauth: true,
        oauth_window_uri: MOCKED_FIX_OAUTH_URL,
        status: ConnectionStatus.CREATED,
        userId,
      });
    });
  });

  describe("GetConnectionStatus when connection not found in the cache", () => {
    it("returns null when connection not found", async () => {
      const connectionStatus =
        await flinksAdapter.GetConnectionStatus("junk");
      expect(connectionStatus).toBeNull();
    });
  });

  describe("GetConnectionById when refreshing", () => {
    it("sets the connection in cache if it's not found in the cache and userId is present.", async () => {
      const connectionId = "testConnectionId";
      const connectionStatus = await flinksAdapter.GetConnectionById(
        connectionId,
        "testUser",
      );
      expect(connectionStatus).toEqual({
        id: connectionId,
        userId: "testUser",
        aggregator: "flinks",
        is_oauth: true,
      });

      const cachedConnection = await cacheClient.get(connectionId);
      expect(cachedConnection).toEqual({
        connection: {
          id: connectionId,
          userId: "testUser",
          aggregator: "flinks",
          is_oauth: true,
        },
      });
    });
  });

  describe("UpdateConnection", () => {
    it("is not available with flinks", async () => {
      const ret = await flinksAdapter.UpdateConnection(null);
      expect(ret).toEqual(null);
    });
  });

  describe("AnswerChallenge", () => {
    it("does nothing with flinks", async () => {
      const ret = await flinksAdapter.AnswerChallenge(null, null);
      expect(ret).toEqual(true);
    });
  });

  describe("DeleteUser", () => {
    it("deletes the user", async () => {
      let userDeletionAttempted = false;

      server.use(
        http.delete(DELETE_USER_PATH, () => {
          userDeletionAttempted = true;

          return new HttpResponse(null, {
            status: 204,
          });
        }),
      );

      await flinksAdapter.DeleteUser("test-user-name");

      expect(userDeletionAttempted).toBe(true);
    });
  });

  describe("ResolveUserId", () => {
    it("returns the flinks user when searched by flinks customer id", async () => {
      const user = customerData.customers[0];

      const returnedUserId = await flinksAdapter.ResolveUserId(user.username);

      expect(returnedUserId).toEqual(user.id);
    });

    it("creates the user if the user isn't in the list and returns it from there", async () => {
      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers`, () => {
          return HttpResponse.json({ customers: [] });
        }),
      );

      const returnedUserId =
        await flinksAdapter.ResolveUserId("nonExistingUser");

      expect(returnedUserId).toEqual("createdNewCustomerId");
    });

    it("throws an error if customer does not exist and failIfNotFound is true", async () => {
      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers`, () => {
          return HttpResponse.json({ customers: [] });
        }),
      );

      const userId = "nonExistingUserId";

      await expect(
        async () => await flinksAdapter.ResolveUserId(userId, true),
      ).rejects.toThrow(USER_NOT_RESOLVED_ERROR_TEXT);
    });
  });

  describe("HandleOauthResponse", () => {
    it(`handles 'added' event and updates connection status to CONNECTED, triggering account refresh with ${ComboJobTypes.TRANSACTIONS} job type, and calling a success performance event`, async () => {
      const userId = "test-user-id";
      const payload = {
        accounts: [{ institutionLoginId: "test-institution-login-id" }],
      };

      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
          performanceSessionId: "testPerfomanceSessionId",
        },
        userId,
      );

      let accountRefreshCalled = false;

      server.use(
        http.post(
          `${BASE_PATH}/aggregation/v2/customers/:customerId/accounts`,
          () => {
            accountRefreshCalled = true;
            return HttpResponse.json({ success: true });
          },
        ),
      );

      const request = {
        query: { connection_id: createdConnection.id },
        body: { eventType: "added", payload },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(accountRefreshCalled).toBe(true); // Verify the API call was made
      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: "test-institution-login-id",
          status: ConnectionStatus.CONNECTED,
          postMessageEventData: expect.objectContaining({
            memberConnected: expect.objectContaining({
              connectionId: "test-institution-login-id",
            }),
            memberStatusUpdate: expect.objectContaining({
              connectionId: "test-institution-login-id",
            }),
          }),
        }),
      );
      expect(mockPerformanceClient.recordSuccessEvent).toHaveBeenCalledWith(
        "testPerfomanceSessionId",
        "test-institution-login-id",
      );
    });

    it(`handles 'added' event and updates connection status to CONNECTED, triggering transaction history with ${ComboJobTypes.TRANSACTION_HISTORY} job type, and calling a success performance event`, async () => {
      const userId = "test-user-id";
      const payload = {
        accounts: [{ institutionLoginId: "test-institution-login-id" }],
      };

      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
          credentials: [],
          performanceSessionId: "testPerfomanceSessionId",
        },
        userId,
      );

      const transactionHistoryParams = [];

      server.use(
        http.post(FLINKS_HISTORIC_TRANSACTIONS_PATH, ({ params }) => {
          transactionHistoryParams.push({ ...params });

          return HttpResponse.json({});
        }),
      );

      const request = {
        query: { connection_id: createdConnection.id },
        body: { eventType: "added", payload },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(transactionHistoryParams).toEqual([
        {
          accountId: accountsData.accounts[0].id,
          customerId: userId,
        },
        {
          accountId: accountsData.accounts[1].id,
          customerId: userId,
        },
      ]);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: "test-institution-login-id",
          status: ConnectionStatus.CONNECTED,
          postMessageEventData: expect.objectContaining({
            memberConnected: expect.objectContaining({
              connectionId: "test-institution-login-id",
            }),
            memberStatusUpdate: expect.objectContaining({
              connectionId: "test-institution-login-id",
            }),
          }),
        }),
      );
      expect(mockPerformanceClient.recordSuccessEvent).toHaveBeenCalledWith(
        "testPerfomanceSessionId",
        "test-institution-login-id",
      );
    });

    it("handles 'adding' event by calling a resume performance event", async () => {
      const userId = "test-user-id";
      const payload = {
        accounts: [{ institutionLoginId: "test-institution-login-id" }],
      };

      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
          performanceSessionId: "testPerfomanceSessionId",
        },
        userId,
      );

      const request = {
        query: { connection_id: createdConnection.id },
        body: { eventType: "adding", payload },
      };

      await flinksAdapter.HandleOauthResponse(request);

      expect(
        mockPerformanceClient.recordConnectionResumeEvent,
      ).toHaveBeenCalledWith({ connectionId: "testPerfomanceSessionId" });
    });

    it("handles 'done' eventType and returns the connection", async () => {
      const userId = "test-user-id";
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
          performanceSessionId: "testPerfomanceSessionId",
        },
        userId,
      );

      const request = {
        query: { connection_id: createdConnection.id },
        body: { eventType: "done", payload: {} },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CREATED,
        }),
      );
    });

    it("handles 'credentialsUpdated' event and updates connection status to CONNECTED", async () => {
      const userId = "test-user-id";
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
        },
        userId,
      );

      const request = {
        query: { connection_id: createdConnection.id },
        body: { eventType: "credentialsUpdated", payload: {} },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    it("handles 'exit' reason with code 100 and updates connection status to CLOSED", async () => {
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
        },
        "test-user-id",
      );

      const request = {
        query: {
          connection_id: createdConnection.id,
          reason: "exit",
          code: "100",
        },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CLOSED,
        }),
      );
    });

    it("handles 'error' reason with code 201 and updates connection status to Connected", async () => {
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
        },
        "test-user-id",
      );

      const request = {
        query: {
          connection_id: createdConnection.id,
          reason: "error",
          code: "201",
        },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    it("handles 'done' reason and sets redirect_complete to true", async () => {
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
        },
        "test-user-id",
      );

      const request = {
        query: { connection_id: createdConnection.id, reason: "done" },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    it("handles 'complete' reason and updates connection status to CONNECTED", async () => {
      const createdConnection = await flinksAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
        },
        "test-user-id",
      );

      const request = {
        query: {
          connection_id: createdConnection.id,
          reason: "complete",
        },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    it("returns null if the connection does not exist", async () => {
      const connectionId = "non-existing-connection-id";

      const request = {
        query: { connection_id: connectionId },
      };

      const updatedConnection =
        await flinksAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toBeNull();
    });
  });
});
