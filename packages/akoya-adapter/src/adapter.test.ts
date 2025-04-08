import 'dotenv/config'

import { createClient as createCacheClient } from "./test/utils/cacheClient";
import { logClient } from "./test/utils/logClient";
import { AkoyaAdapter } from "./adapter";
import { ConnectionStatus } from "@repo/utils";

export const cacheClient = createCacheClient();

jest.mock('uuid', () => ({ v4: () => '123456789' }));

const testCredential = {
  id: "testCredentialId",
  label: "testCredentialLabel",
  value: "testCredentialValue",
  field_type: "testCredentialFieldType",
  field_name: "testCredentialFieldName"
};

export const aggregatorCredentials = {
  akoyaSandbox: {
    appKey: process.env.AkoyaAppKey || 'test-appKey',
    secret: process.env.AkoyaSecret || 'test-app-secret',
  },
  akoyaProd: {
    appKey: process.env.AkoyaAppKeyProd || 'test-appKey',
    secret: process.env.AkoyaSecretProd || 'test-app-secret'
  }
};

const akoyaAdapterSandbox = new AkoyaAdapter({
  sandbox: true,
  sessionId: 'test-session',
  dependencies: {
    cacheClient,
    logClient,
    aggregatorCredentials,
    envConfig: process.env
  }
});

const akoyaAdapter = new AkoyaAdapter({
  sandbox: false,
  sessionId: 'test-session',
  dependencies: {
    cacheClient,
    logClient,
    aggregatorCredentials,
    envConfig: process.env
  }
});

const oauth_window_uri_example = 'https://idp.ddp.akoya.com/auth?connector=testInstitutionId&client_id=undefined&redirect_uri=undefined/oauth/akoya/redirect_from&state=test-session123456789&response_type=code&scope=openid email profile offline_access'

describe("akoya aggregator", () => {
  describe("GetInsitutionById", () => {
    
    it("Maps correct fields", async () => {
      const ret = await akoyaAdapterSandbox.GetInstitutionById("testId")
      expect(ret).toEqual({
        id: 'testId',
        logo_url: null,
        name: null,
        oauth: true,
        url: null,
        aggregator: "akoya_sandbox"
      });
    });
  });
  describe("ListInstitutionCredentials", () => {
    it("transforms the credentials into useable form, not available with akoya atm", async () => {
      expect(await akoyaAdapter.ListInstitutionCredentials("testId"))
        .toEqual([]);
    });
  });

  describe("ListConnections", () => {
    it("retrieves and transforms the members, not available with akoya atm", async () => {
      expect(await akoyaAdapter.ListConnections("testId")).toEqual([]);
    });
  });

  describe("ListConnectionCredentials", () => {
    it("retreieves and transforms member credentials, not available with akoya atm", async () => {
      expect(
        await akoyaAdapter.ListConnectionCredentials(
          "testMemberId",
          "test-user-name"
        )
      ).toEqual([]);
    });
  });

  describe("CreateConnection", () => {
    const baseConnectionRequest = {
      id: "testId",
      initial_job_type: "verification",
      background_aggregation_is_disabled: false,
      credentials: [testCredential],
      institutionId: "testInstitutionId",
      is_oauth: false,
      skip_aggregation: false,
      metadata: "testMetadata"
    };
      
      let member_id: string;

      it("creates member with a oauth_window_uri", async () => {
        const ret = await akoyaAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            is_oauth: true
          },
          "test-user-name"
        );
        expect(ret.oauth_window_uri).toEqual(oauth_window_uri_example);
        member_id = ret.id
      });

      it("returns the member from readMember", async () => {
        const testUserId = "test-user-name";
        const member = await akoyaAdapter.GetConnectionById(
          member_id,
          testUserId
        );

        expect(member).toEqual({
          id: member_id,
          institution_code: "testInstitutionId",
          is_oauth: true,
          oauth_window_uri: oauth_window_uri_example,
          aggregator: "akoya",
          credentials: [],
          status: ConnectionStatus.PENDING,
          raw_status: 'PENDING',
          userId: testUserId
        });
      });
      it("returns a rejected connection status if there's an error with oauthStatus", async () => {

        const connectionStatus = await akoyaAdapter.GetConnectionStatus(
          member_id,
          "testJobId",
          false,
          "test-user-name"
        );

        expect(connectionStatus.status).toEqual(ConnectionStatus.PENDING);
      });
  });

  describe("ResolveUserId", () => {
    it("returns the user_id from parameter", async () => {

      const returnedUserId = await akoyaAdapter.ResolveUserId('user_id');

      expect(returnedUserId).toEqual('user_id');
    });

  });


  describe("DeleteConnection", () => {
    it("deletes the connection", async () => {
      await akoyaAdapter.DeleteConnection("testId", "test-user-name");
      const cached = await cacheClient.get('testId');
      expect(cached).toBe(null);
    });
  });

  describe("DeleteUser", () => {
    it("is not available with akoya", async () => {
      const ret = await akoyaAdapter.DeleteUser("test-user-name");
      expect(ret).toEqual(null);
    });
  });

  describe("UpdateConnection", () => {
    it("is not available with akoya", async () => {
      const ret = await akoyaAdapter.UpdateConnection(
        null,
        "test-user-name"
      );
      expect(ret).toEqual(null);
    });
  });
  
});
