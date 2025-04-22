import { http, HttpResponse } from "msw";

import { createClient as createCacheClient } from "./test/utils/cacheClient";
import { logClient } from "./test/utils/logClient";
import { FinicityAdapter } from "./adapter";
import { ConnectionStatus } from "@repo/utils";

import { institutionDetailData } from "./test/testData/institutions";
import { customerData } from "./test/testData/users";
import { server } from "./test/testServer";

import { DELETE_USER_PATH } from "./test/handlers";

export const cacheClient = createCacheClient();

const testCredential = {
  id: "testCredentialId",
  label: "testCredentialLabel",
  value: "testCredentialValue",
  field_type: "testCredentialFieldType",
  field_name: "testCredentialFieldName",
};

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
    logClient,
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
    logClient,
    aggregatorCredentials,
    getWebhookHostUrl: () => "testWebhookHostUrl",
    envConfig: {
      HostUrl: "http://test.universalconnect.org",
    },
  },
});

describe("finicity aggregator", () => {
  describe("GetInsitutionById", () => {
    it("is dummy", async () => {});
    it("Maps correct fields", async () => {
      const ret = await finicityAdapterSandbox.GetInstitutionById("testId");
      expect(ret).toEqual({
        id: "testId",
        logo_url: institutionDetailData.institution.urlLogonApp,
        name: institutionDetailData.institution.name,
        oauth: true,
        url: institutionDetailData.institution.urlHomeApp,
        aggregator: "finicity_sandbox",
      });
    });
  });
  describe("ListInstitutionCredentials", () => {
    it("transforms the credentials into useable form, not available with finicity atm", async () => {
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

  describe("CreateConnection", () => {
    const baseConnectionRequest = {
      id: "testId",
      initial_job_type: "verification",
      background_aggregation_is_disabled: false,
      credentials: [testCredential],
      institutionId: "testInstitutionId",
      is_oauth: false,
      skip_aggregation: false,
      metadata: "testMetadata",
    };

    describe("createMemberPayload spy tests", () => {
      it("creates member with a oauth_window_uri", async () => {
        const ret = await finicityAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            is_oauth: true,
          },
          "test-user-name",
        );

        expect(ret.oauth_window_uri).toEqual("http://example.url");
      });
    });

    describe("DeleteConnection", () => {
      it("deletes the connection", async () => {
        await finicityAdapter.DeleteConnection("testId", "test-user-name");
        const cached = await cacheClient.get("testId");
        expect(cached).toBe(null);
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

    describe("UpdateConnection", () => {
      it("is not available with finicity", async () => {
        const ret = await finicityAdapter.UpdateConnection(
          null,
          "test-user-name",
        );
        expect(ret).toEqual(null);
      });
    });

    describe("GetConnectionById", () => {
      it("returns the member from readMember", async () => {
        const testUserId = "test-user-name";
        const member = await finicityAdapter.GetConnectionById(
          "connectionId",
          testUserId,
        );

        expect(member).toEqual({
          id: `test-session;connectionId`,
          is_oauth: true,
          oauth_window_uri: "http://example.url",
          aggregator: "finicity",
          credentials: [],
          status: ConnectionStatus.PENDING,
          raw_status: "PENDING",
          userId: testUserId,
        });
      });
    });

    describe("GetConnectionStatus", () => {
      it("returns a rejected connection status if there's an error with oauthStatus", async () => {
        const connectionStatus = await finicityAdapter.GetConnectionStatus(
          "testMemberId",
          "testJobId",
          false,
          "test-user-name",
        );

        expect(connectionStatus.status).toEqual(ConnectionStatus.PENDING);
      });
    });
  });

  describe("ResolveUserId", () => {
    it("returns the finicity user from listUsers if it's available", async () => {
      const user = customerData.customers[0];

      const returnedUserId = await finicityAdapter.ResolveUserId(user.username);

      expect(returnedUserId).toEqual(user.id);
    });

    it("creates the user if the user isn't in the list and returns it from there", async () => {
      const returnedUserId =
        await finicityAdapter.ResolveUserId("nonExistingUser");

      expect(returnedUserId).toEqual("createdNewCustomerId");
    });

    it("throws an error if customer does not exist and failIfNotFound is true", async () => {
      const userId = "nonExistingUserId";

      await expect(
        async () => await finicityAdapter.ResolveUserId(userId, true),
      ).rejects.toThrow("User not resolved successfully");
    });
  });
});
