import { ConnectionStatus, OAuthStatus } from "../shared/contract";
import { AggregatorAdapterBase } from "./index";

const testConnectionId = "test_connection_id";

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
  describe("getOauthState", () => {
    beforeAll(async () => {
      await aggregatorAdapterBase.init();
    });

    it("returns a pending oauth state", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockImplementation(() =>
          Promise.resolve({
            status: ConnectionStatus.PENDING,
          }),
        ),
      };

      expect(
        await aggregatorAdapterBase.getOauthState(testConnectionId),
      ).toEqual({
        oauth_state: {
          guid: "test_connection_id",
          inbound_member_guid: "test_connection_id",
          outbound_member_guid: "test_connection_id",
          auth_status: OAuthStatus.PENDING,
        },
      });
    });

    it("returns a connected oauth state", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockImplementation(() =>
          Promise.resolve({
            status: ConnectionStatus.CONNECTED,
          }),
        ),
      };

      expect(
        await aggregatorAdapterBase.getOauthState(testConnectionId),
      ).toEqual({
        oauth_state: {
          guid: "test_connection_id",
          inbound_member_guid: "test_connection_id",
          outbound_member_guid: "test_connection_id",
          auth_status: OAuthStatus.COMPLETE,
        },
      });
    });

    it("returns an errored oauth state", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        GetConnectionStatus: jest.fn().mockImplementation(() =>
          Promise.resolve({
            status: ConnectionStatus.DENIED,
          }),
        ),
      };

      expect(
        await aggregatorAdapterBase.getOauthState(testConnectionId),
      ).toEqual({
        oauth_state: {
          guid: "test_connection_id",
          inbound_member_guid: "test_connection_id",
          outbound_member_guid: "test_connection_id",
          auth_status: OAuthStatus.ERROR,
          error_reason: ConnectionStatus.DENIED,
        },
      });
    });
  });
});
