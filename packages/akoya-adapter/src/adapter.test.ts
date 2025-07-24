import "dotenv/config";

import {
  createClient as createCacheClient,
  createMockPerformanceClient,
} from "@repo/utils/test";
import { AKOYA_BASE_PATH, AKOYA_BASE_PROD_PATH, AkoyaAdapter } from "./adapter";
import { Connection, ConnectionStatus, PerformanceClient } from "@repo/utils";
import { AKOYA_AGGREGATOR_STRING } from "./index";
import { createLogClient } from "@repo/utils-dev-dependency";

const cacheClient = createCacheClient();
const logClient = createLogClient();

jest.mock("uuid", () => ({ v4: () => "123456789" }));

const aggregatorCredentials = {
  akoyaSandbox: {
    clientId: "test-clientId",
    secret: "test-app-secret",
  },
  akoyaProd: {
    clientId: "prod-test-clientId",
    secret: "prod-test-app-secret",
  },
};

describe("akoya aggregator", () => {
  let akoyaAdapterSandbox: AkoyaAdapter;
  let akoyaAdapter: AkoyaAdapter;
  let mockPerformanceClient: PerformanceClient;

  beforeEach(() => {
    mockPerformanceClient = createMockPerformanceClient();

    akoyaAdapterSandbox = new AkoyaAdapter({
      sandbox: true,
      dependencies: {
        cacheClient,
        logClient,
        performanceClient: mockPerformanceClient,
        aggregatorCredentials,
        envConfig: {
          HostUrl: "http://localhost:8080",
        },
      },
    });

    akoyaAdapter = new AkoyaAdapter({
      sandbox: false,
      dependencies: {
        cacheClient,
        logClient,
        performanceClient: mockPerformanceClient,
        aggregatorCredentials,
        envConfig: {
          HostUrl: "http://localhost:8080",
        },
      },
    });
  });

  describe("GetInsitutionById", () => {
    it("Maps correct fields", async () => {
      const ret = await akoyaAdapterSandbox.GetInstitutionById("testId");
      expect(ret).toEqual({
        id: "testId",
        aggregator: "akoya_sandbox",
        supportsOauth: true,
      });
    });
  });

  describe("ListInstitutionCredentials", () => {
    it("transforms the credentials into useable form, not available with akoya atm", async () => {
      expect(await akoyaAdapter.ListInstitutionCredentials("testId")).toEqual(
        [],
      );
    });
  });

  describe("ListConnectionCredentials", () => {
    it("retreieves and transforms member credentials, not available with akoya atm", async () => {
      expect(
        await akoyaAdapter.ListConnectionCredentials(
          "testMemberId",
          "test-user-name",
        ),
      ).toEqual([]);
    });
  });

  describe("ListConnections", () => {
    it("retrieves and transforms the members, not available with akoya atm", async () => {
      expect(await akoyaAdapter.ListConnections("testId")).toEqual([]);
    });
  });

  describe("CreateConnection, getConnectionById, GetConnectionStatus", () => {
    const baseConnectionRequest = {
      credentials: [],
      institutionId: "testInstitutionId",
    };
    const testUserId = "test-user-id";

    it("creates a connection and gets the connection by id then gets the status", async () => {
      const connectionId = "testConnectionId";
      const connection = await akoyaAdapter.CreateConnection(
        {
          ...baseConnectionRequest,
          is_oauth: true,
          performanceSessionId: connectionId,
        },
        testUserId,
      );
      const oauth_window_uri_example = `https://idp.ddp.akoya.com/auth?connector=testInstitutionId&client_id=prod-test-clientId&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Foauth%2Fakoya%2Fredirect_from&state=${connectionId}&response_type=code&scope=openid+profile+offline_access`;

      const expectedConnectionObj = {
        id: connectionId,
        institution_code: "testInstitutionId",
        is_oauth: true,
        oauth_window_uri: oauth_window_uri_example,
        aggregator: AKOYA_AGGREGATOR_STRING,
        credentials: [],
        status: ConnectionStatus.CREATED,
        userId: testUserId,
      };

      expect(connection).toEqual(expectedConnectionObj);

      const connectionById = await akoyaAdapter.GetConnectionById(connectionId);
      expect(connectionById).toEqual(expectedConnectionObj);

      const connectionStatus = await akoyaAdapter.GetConnectionStatus(
        connectionId,
        "",
      );

      expect(connectionStatus.status).toEqual(ConnectionStatus.PENDING);
    });

    it("gets the proper oauth_window_uri for production", async () => {
      const connection = await akoyaAdapter.CreateConnection(
        {
          ...baseConnectionRequest,
          is_oauth: true,
        },
        testUserId,
      );

      const oauthUrl = new URL(connection.oauth_window_uri);
      expect(oauthUrl.origin).toBe(AKOYA_BASE_PROD_PATH);
      expect(oauthUrl.pathname).toBe("/auth");

      const search = oauthUrl.searchParams;
      expect(search.get("redirect_uri")).toBe(
        "http://localhost:8080/oauth/akoya/redirect_from",
      );
    });

    it("gets the proper oauth_window_uri for sandbox", async () => {
      const connection = await akoyaAdapterSandbox.CreateConnection(
        {
          ...baseConnectionRequest,
          is_oauth: true,
        },
        testUserId,
      );

      const oauthUrl = new URL(connection.oauth_window_uri);
      expect(oauthUrl.origin).toBe(AKOYA_BASE_PATH);
      expect(oauthUrl.pathname).toBe("/auth");

      const search = oauthUrl.searchParams;
      expect(search.get("redirect_uri")).toBe(
        "http://localhost:8080/oauth/akoya_sandbox/redirect_from",
      );
    });
  });

  describe("ResolveUserId", () => {
    it("returns the user_id from parameter", async () => {
      const returnedUserId = await akoyaAdapter.ResolveUserId("user_id");

      expect(returnedUserId).toEqual("user_id");
    });
  });

  describe("DeleteConnection", () => {
    it("deletes the connection", async () => {
      const response = await akoyaAdapter.DeleteConnection("testId");
      const cached = await cacheClient.get("testId");
      expect(cached).toBe(null);
      expect(response).toEqual({
        status: 200,
        data: {
          message: "Connection deleted successfully from cache",
        },
      });
    });
  });

  describe("DeleteUser", () => {
    it("is not available with akoya", async () => {
      const ret = await akoyaAdapter.DeleteUser("test-user-name");
      expect(ret).toEqual(undefined);
    });
  });

  describe("UpdateConnection", () => {
    it("is not available with akoya", async () => {
      const ret = await akoyaAdapter.UpdateConnection(null);
      expect(ret).toEqual(undefined);
    });
  });

  describe("HandleOauthResponse", () => {
    it("returns the updated connection if valid code and connection is found. And records performance success event", async () => {
      const requestId = "abc123";
      const connection: Connection = {
        id: requestId,
        status: ConnectionStatus.PENDING,
        institution_code: "inst-001",
        userId: null,
      };

      await cacheClient.set(requestId, connection);

      const result = await akoyaAdapter.HandleOauthResponse({
        query: {
          state: requestId,
          code: "fake_oauth_code",
        },
      });

      expect(result).toEqual({
        status: ConnectionStatus.CONNECTED,
        institution_code: "inst-001",
        id: "inst-001",
        postMessageEventData: {
          memberConnected: {
            akoyaAuthCode: "fake_oauth_code",
          },
          memberStatusUpdate: {
            akoyaAuthCode: "fake_oauth_code",
          },
        },
        userId: null,
      });

      expect(mockPerformanceClient.recordSuccessEvent).toHaveBeenCalledWith(
        requestId,
      );

      const cached = await cacheClient.get(requestId);
      expect(cached).toEqual(result);
    });

    it("throws if connection not found in cache", async () => {
      const request = {
        query: {
          state: "nonexistent",
          code: "code123",
        },
      };

      expect(mockPerformanceClient.recordSuccessEvent).not.toHaveBeenCalled();

      await expect(akoyaAdapter.HandleOauthResponse(request)).rejects.toThrow(
        "Connection failed",
      );
    });

    it("Gets status DENIED if no code in the request query", async () => {
      const requestId = "abc123";
      await cacheClient.set(requestId, {});

      const result = await akoyaAdapter.HandleOauthResponse({
        query: {
          state: requestId,
        },
      });

      expect(mockPerformanceClient.recordSuccessEvent).not.toHaveBeenCalled();

      expect(result.status).toEqual(ConnectionStatus.DENIED);

      const cached = (await cacheClient.get(requestId)) as { status: string };
      expect(cached.status).toEqual(ConnectionStatus.DENIED);
    });
  });
});
