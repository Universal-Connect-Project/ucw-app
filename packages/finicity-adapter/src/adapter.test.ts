import { http, HttpResponse } from "msw";

import {
  createClient as createCacheClient,
  createLogClient,
} from "@repo/utils/test";
import { FinicityAdapter } from "./adapter";
import {
  ComboJobTypes,
  ConnectionStatus,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";

import { customerData } from "./test/testData/users";
import { server } from "./test/testServer";

import {
  DELETE_USER_PATH,
  MOCKED_FIX_OAUTH_URL,
  MOCKED_OAUTH_URL,
} from "./test/handlers";
import { BASE_PATH } from "./apiClient";

export const cacheClient = createCacheClient();

export const aggregatorCredentials = {
  finicitySandbox: {
    partnerId: "testPartnerId",
    appKey: "testAppKey",
    secret: "testAppSecret",
    basePath: "https://api.finicity.com",
    vcEndpoint: "https://api.finicity.com/",
    aggregator: "finicity_sandbox",
    available: true,
  },
  finicityProd: {
    partnerId: "prodPartnerId",
    appKey: "prodAppKey",
    secret: "prodAppSecret",
    basePath: "https://api.finicity.com",
    vcEndpoint: "https://api.finicity.com/",
    aggregator: "finicity",
    available: true,
  },
};

const finicityAdapterSandbox = new FinicityAdapter({
  sandbox: true,
  sessionId: "test-session",
  dependencies: {
    cacheClient,
    logClient: createLogClient(),
    aggregatorCredentials,
    getWebhookHostUrl: () => "testWebhookHostUrl",
    envConfig: {
      HostUrl: "http://test.universalconnect.org",
    },
  },
});

const finicityAdapter = new FinicityAdapter({
  sandbox: false,
  sessionId: "test-session",
  dependencies: {
    cacheClient,
    logClient: createLogClient(),
    aggregatorCredentials,
    getWebhookHostUrl: () => "testWebhookHostUrl",
    envConfig: {
      HostUrl: "http://test.universalconnect.org",
    },
  },
});

describe("finicity aggregator", () => {
  describe("GetInsitutionById", () => {
    it("Maps correct fields", async () => {
      const testInstitutionId = "testId";
      const institution =
        await finicityAdapterSandbox.GetInstitutionById(testInstitutionId);
      expect(institution).toEqual({
        id: testInstitutionId,
        aggregator: "finicity_sandbox",
        supportsOauth: true,
      });
    });
  });

  describe("ListInstitutionCredentials", () => {
    it("does nothing for Finicity", async () => {
      expect(
        await finicityAdapter.ListInstitutionCredentials("testId"),
      ).toEqual([]);
    });
  });

  describe("ListConnections", () => {
    it("retrieves and transforms the members, not available with finicity atm", async () => {
      expect(await finicityAdapter.ListConnections("testId")).toEqual([]);
    });
  });

  describe("ListConnectionCredentials", () => {
    it("retreieves and transforms member credentials, not available with finicity atm", async () => {
      expect(
        await finicityAdapter.ListConnectionCredentials(
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
      aggregator: "finicity",
      status: ConnectionStatus.CREATED,
    };

    it("creates a connection then gets connection by Id then gets connection then deletes a connection", async () => {
      const createdConnection = await finicityAdapter.CreateConnection(
        {
          ...baseConnectionRequest,
        },
        testUserId,
      );

      expect(createdConnection).toEqual(
        expect.objectContaining(expectedConnectionObject),
      );

      const connectionById = await finicityAdapter.GetConnectionById(
        createdConnection.id,
      );
      expect(connectionById).toEqual(
        expect.objectContaining(expectedConnectionObject),
      );

      const connectionStatus = await finicityAdapter.GetConnectionStatus(
        connectionById.id,
      );
      expect(connectionStatus).toEqual(
        expect.objectContaining({
          ...expectedConnectionObject,
          status: ConnectionStatus.PENDING,
        }),
      );

      await finicityAdapter.DeleteConnection(connectionById.id);

      const connectionByIdAfterDelete = await finicityAdapter.GetConnectionById(
        createdConnection.id,
      );

      expect(connectionByIdAfterDelete).toBeUndefined();
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
      };
      const userId = "testUserId";
      const connection = await finicityAdapter.CreateConnection(
        request,
        userId,
      );
      expect(connection).toEqual({
        aggregator: "finicity",
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
        await finicityAdapter.GetConnectionStatus("junk");
      expect(connectionStatus).toBeNull();
    });
  });

  describe("GetConnectionById when refreshing", () => {
    it("sets the connection in cache if it's not found in the cache and userId is present.", async () => {
      const connectionId = "testConnectionId";
      const connectionStatus = await finicityAdapter.GetConnectionById(
        connectionId,
        "testUser",
      );
      expect(connectionStatus).toEqual({
        id: connectionId,
        userId: "testUser",
        aggregator: "finicity",
        is_oauth: true,
      });

      const cachedConnection = await cacheClient.get(connectionId);
      expect(cachedConnection).toEqual({
        connection: {
          id: connectionId,
          userId: "testUser",
          aggregator: "finicity",
          is_oauth: true,
        },
      });
    });
  });

  describe("UpdateConnection", () => {
    it("is not available with finicity", async () => {
      const ret = await finicityAdapter.UpdateConnection(null);
      expect(ret).toEqual(null);
    });
  });

  describe("AnswerChallenge", () => {
    it("does nothing with finicity", async () => {
      const ret = await finicityAdapter.AnswerChallenge(null, null);
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

      await finicityAdapter.DeleteUser("test-user-name");

      expect(userDeletionAttempted).toBe(true);
    });
  });

  describe("ResolveUserId", () => {
    it("returns the finicity user when searched by finicity customer id", async () => {
      const user = customerData.customers[0];

      const returnedUserId = await finicityAdapter.ResolveUserId(user.username);

      expect(returnedUserId).toEqual(user.id);
    });

    it("creates the user if the user isn't in the list and returns it from there", async () => {
      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers`, () => {
          return HttpResponse.json({ customers: [] });
        }),
      );

      const returnedUserId =
        await finicityAdapter.ResolveUserId("nonExistingUser");

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
        async () => await finicityAdapter.ResolveUserId(userId, true),
      ).rejects.toThrow(USER_NOT_RESOLVED_ERROR_TEXT);
    });
  });

  describe("HandleOauthResponse", () => {
    it("handles 'added' event and updates connection status to CONNECTED, triggering account refresh with transactions job type", async () => {
      const userId = "test-user-id";
      const payload = {
        accounts: [{ institutionLoginId: "test-institution-login-id" }],
      };

      const createdConnection = await finicityAdapter.CreateConnection(
        {
          institutionId: "testInstitutionId",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          credentials: [],
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
        await finicityAdapter.HandleOauthResponse(request);

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
    });

    it("handles 'credentialsUpdated' event and updates connection status to CONNECTED", async () => {
      const userId = "test-user-id";
      const createdConnection = await finicityAdapter.CreateConnection(
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
        await finicityAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    it("handles 'exit' reason with code 100 and updates connection status to CLOSED", async () => {
      const createdConnection = await finicityAdapter.CreateConnection(
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
        await finicityAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CLOSED,
        }),
      );
    });

    it("handles 'error' reason with code 201 and updates connection status to Connected", async () => {
      const createdConnection = await finicityAdapter.CreateConnection(
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
        await finicityAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toEqual(
        expect.objectContaining({
          id: createdConnection.id,
          status: ConnectionStatus.CONNECTED,
        }),
      );
    });

    it("handles 'done' reason and sets redirect_complete to true", async () => {
      const createdConnection = await finicityAdapter.CreateConnection(
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
        await finicityAdapter.HandleOauthResponse(request);

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
        await finicityAdapter.HandleOauthResponse(request);

      expect(updatedConnection).toBeNull();
    });
  });
});
