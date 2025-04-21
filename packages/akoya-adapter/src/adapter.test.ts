import "dotenv/config";

import {
  createClient as createCacheClient,
  createLogClient,
} from "@repo/utils/test";
import { AkoyaAdapter } from "./adapter";
import { Connection, ConnectionStatus } from "@repo/utils";

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

const akoyaAdapterSandbox = new AkoyaAdapter({
  sandbox: true,
  dependencies: {
    cacheClient,
    logClient,
    aggregatorCredentials,
    envConfig: process.env,
  },
});

const akoyaAdapter = new AkoyaAdapter({
  sandbox: false,
  dependencies: {
    cacheClient,
    logClient,
    aggregatorCredentials,
    envConfig: process.env,
  },
});

describe("akoya aggregator", () => {
  describe("GetInsitutionById", () => {
    it("Maps correct fields", async () => {
      const ret = await akoyaAdapterSandbox.GetInstitutionById("testId");
      expect(ret).toEqual({
        id: "testId",
        logo_url: null,
        name: null,
        oauth: true,
        url: null,
        aggregator: "akoya_sandbox",
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

    it("creates a connection and gets the connection by id then gets the status", async () => {
      const testUserId = "test-user-id";
      const oauth_window_uri_example =
        "https://idp.ddp.akoya.com/auth?connector=testInstitutionId&client_id=prod-test-clientId&redirect_uri=undefined%2Foauth%2Fakoya%2Fredirect_from&state=123456789&response_type=code&scope=openid+profile+offline_access";

      const connection = await akoyaAdapter.CreateConnection(
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
        oauth_window_uri: oauth_window_uri_example,
        aggregator: "akoya",
        credentials: [],
        status: ConnectionStatus.PENDING,
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
  });

  describe("ResolveUserId", () => {
    it("returns the user_id from parameter", async () => {
      const returnedUserId = await akoyaAdapter.ResolveUserId("user_id");

      expect(returnedUserId).toEqual("user_id");
    });
  });

  describe("DeleteConnection", () => {
    it("deletes the connection", async () => {
      await akoyaAdapter.DeleteConnection("testId", "test-user-name");
      const cached = await cacheClient.get("testId");
      expect(cached).toBe(null);
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
    it("returns the updated connection if valid code and connection is found", async () => {
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

      expect(result.status).toEqual(ConnectionStatus.DENIED);

      const cached = (await cacheClient.get(requestId)) as { status: string };
      expect(cached.status).toEqual(ConnectionStatus.DENIED);
    });
  });
});
