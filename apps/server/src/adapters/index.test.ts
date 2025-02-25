import { ConnectionStatus, OAuthStatus } from "../shared/contract";
import { AggregatorAdapterBase } from "./index";
const testConnectionId = "test_connection_id";
jest.mock("uuid", () => ({ v4: () => "adfd01fb-309b-4e1c-9117-44d003f5d7fc" }));

const aggregatorAdapterBase = new AggregatorAdapterBase({
  context: {
    aggregator: "testAdapterA",
    auth: {
      token: "test_token",
      iv: "test_iv",
    },
    resolved_user_id: "test_user_id",
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
          guid: "test_connection_id",
          inbound_member_guid: "test_connection_id",
          outbound_member_guid: "test_connection_id",
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
        guid: "test_connection_id",
        inbound_member_guid: "test_connection_id",
        outbound_member_guid: "test_connection_id",
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
        guid: "test_connection_id",
        inbound_member_guid: "test_connection_id",
        outbound_member_guid: "test_connection_id",
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
        guid: "test_connection_id",
        inbound_member_guid: "test_connection_id",
        outbound_member_guid: "test_connection_id",
        auth_status: OAuthStatus.ERROR,
        error_reason: ConnectionStatus.DENIED,
      });
    });
  });
});
