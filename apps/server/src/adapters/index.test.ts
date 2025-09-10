import { OAuthStatus, ComboJobTypes } from "@repo/utils";
import { ConnectionStatus } from "../shared/contract";
import { AggregatorAdapterBase } from "./index";
import { get } from "../services/storageClient/redis";

const testConnectionId = "testConnectionId";
jest.mock("uuid", () => ({ v4: () => "adfd01fb-309b-4e1c-9117-44d003f5d7fc" }));

const aggregatorAdapterBase = new AggregatorAdapterBase({
  context: {
    aggregator: "testAdapterA",
    auth: {
      token: "test_token",
      iv: "test_iv",
    },
    resolvedUserId: "test_user_id",
  },
});

describe("AggregatorAdapterBase", () => {
  describe("getOauthStates", () => {
    it("returns a connected state", async () => {
      await aggregatorAdapterBase.init();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.CONNECTED,
        }),
      };

      expect(
        await aggregatorAdapterBase.getOauthStates(testConnectionId),
      ).toEqual([
        {
          guid: "testConnectionId",
          inbound_member_guid: "testConnectionId",
          outbound_member_guid: "testConnectionId",
          auth_status: OAuthStatus.COMPLETE,
        },
      ]);
    });
  });

  describe("getOauthState", () => {
    beforeAll(async () => {
      await aggregatorAdapterBase.init();
    });

    it("returns a pending oauth state", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.PENDING,
        }),
      };

      expect(
        await aggregatorAdapterBase.getOauthState(testConnectionId),
      ).toEqual({
        guid: "testConnectionId",
        inbound_member_guid: "testConnectionId",
        outbound_member_guid: "testConnectionId",
        auth_status: OAuthStatus.PENDING,
      });
    });

    it("returns a connected oauth state", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.CONNECTED,
        }),
      };

      expect(
        await aggregatorAdapterBase.getOauthState(testConnectionId),
      ).toEqual({
        guid: "testConnectionId",
        inbound_member_guid: "testConnectionId",
        outbound_member_guid: "testConnectionId",
        auth_status: OAuthStatus.COMPLETE,
      });
    });

    it("returns an errored oauth state", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.DENIED,
        }),
      };

      expect(
        await aggregatorAdapterBase.getOauthState(testConnectionId),
      ).toEqual({
        guid: "testConnectionId",
        inbound_member_guid: "testConnectionId",
        outbound_member_guid: "testConnectionId",
        auth_status: OAuthStatus.ERROR,
        error_reason: ConnectionStatus.DENIED,
      });
    });
  });

  describe("createConnection", () => {
    const mockCreateConnectionRequest = {
      institutionId: "testInstitutionId",
      credentials: [
        { id: "username", value: "testUser" },
        { id: "password", value: "testPass" },
      ],
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      is_oauth: true,
    };

    const mockConnection = {
      id: "testConnectionId",
      cur_job_id: "testJobId",
      status: ConnectionStatus.CREATED,
      aggregator: "testAdapterA",
      userId: "test_user_id",
      institution_code: "testInstitutionId",
    };

    beforeEach(() => {
      jest.clearAllMocks();
      aggregatorAdapterBase.context.current_job_id = null;
      aggregatorAdapterBase.context.oauth_referral_source = "test_source";
      aggregatorAdapterBase.context.scheme = "test_scheme";
    });

    beforeAll(async () => {
      await aggregatorAdapterBase.init();
    });

    it("successfully creates a connection and sets context and updates current_job_id", async () => {
      aggregatorAdapterBase.context.current_job_id = "previousJobId";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        CreateConnection: jest.fn().mockResolvedValue(mockConnection),
      };

      const result = await aggregatorAdapterBase.createConnection(
        mockCreateConnectionRequest,
      );

      expect(result).toEqual(mockConnection);
      expect(aggregatorAdapterBase.context.current_job_id).toBe("testJobId");

      const connectionContext = await get("context_testConnectionId");
      expect(connectionContext).toEqual({
        oauth_referral_source: "test_source",
        scheme: "test_scheme",
        aggregatorInstitutionId: "testInstitutionId",
      });
    });

    it("calls aggregatorAdapter.CreateConnection with correct parameters", async () => {
      const mockCreateConnection = jest.fn().mockResolvedValue(mockConnection);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        CreateConnection: mockCreateConnection,
      };

      await aggregatorAdapterBase.createConnection(mockCreateConnectionRequest);

      expect(mockCreateConnection).toHaveBeenCalledWith(
        mockCreateConnectionRequest,
        "test_user_id",
      );
    });

    it("handles connection with null id gracefully", async () => {
      const connectionWithoutId = {
        ...mockConnection,
        id: null as null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        CreateConnection: jest.fn().mockResolvedValue(connectionWithoutId),
      };

      const result = await aggregatorAdapterBase.createConnection(
        mockCreateConnectionRequest,
      );

      expect(result).toEqual(connectionWithoutId);
      const connectionContext = await get("context_testConnectionId");
      expect(connectionContext).toBeUndefined();
    });

    it("stores correct context data in redis", async () => {
      aggregatorAdapterBase.context.oauth_referral_source = "custom_source";
      aggregatorAdapterBase.context.scheme = "custom_scheme";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        CreateConnection: jest.fn().mockResolvedValue(mockConnection),
      };

      await aggregatorAdapterBase.createConnection({
        ...mockCreateConnectionRequest,
        institutionId: "customInstitutionId",
      });

      const connectionContext = await get("context_testConnectionId");
      expect(connectionContext).toEqual({
        oauth_referral_source: "custom_source",
        scheme: "custom_scheme",
        aggregatorInstitutionId: "customInstitutionId",
      });
    });

    it("propagates errors from aggregatorAdapter.CreateConnection", async () => {
      const error = new Error("Connection creation failed");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        CreateConnection: jest.fn().mockRejectedValue(error),
      };

      await expect(
        aggregatorAdapterBase.createConnection(mockCreateConnectionRequest),
      ).rejects.toThrow("Connection creation failed");
    });
  });
});
