import { ConnectionStatus, OAuthStatus } from "../shared/contract";
import { AggregatorAdapterBase, instrumentation } from "./index";
const testConnectionId = "test_connection_id";
jest.mock('uuid', () => ({ v4: () => 'adfd01fb-309b-4e1c-9117-44d003f5d7fc' }));

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
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.PENDING,
        }),
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
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.CONNECTED,
        }),
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
        GetConnectionStatus: jest.fn().mockResolvedValue({
          status: ConnectionStatus.DENIED,
        }),
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


describe("instrumentation", () => {

    it("it takes input paramters", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = {}
      const input = {
        user_id: 'test_user_id',
        current_aggregator: 'test_aggregator',
        current_member_guid: 'test_member_guid',
        current_partner: 'test_partner',
        job_type: 'aggregate',
        session_id: 'test_seesion_id'
      }

      instrumentation(context, input)

      expect(context).toEqual({
        aggregator: "test_aggregator",
        connection_id: "test_member_guid",
        job_type: "aggregate",
        oauth_referral_source: "BROWSER",
        partner: "test_partner",
        scheme: "vcs",
        session_id: "test_seesion_id",
        single_account_select: undefined,
        updated: true,
        user_id: "test_user_id",
      });
    });

    it("it generates a seesion_id", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      
      const context = {}
      const input = {
        user_id: 'test_user_id',
        current_aggregator: 'test_aggregator',
        current_member_guid: 'test_member_guid',
        current_partner: 'test_partner',
        job_type: 'aggregate',
      }
      instrumentation(context, input)

      expect(context).toEqual({
        aggregator: "test_aggregator",
        connection_id: "test_member_guid",
        job_type: "aggregate",
        oauth_referral_source: "BROWSER",
        partner: "test_partner",
        scheme: "vcs",
        session_id: "adfd01fb-309b-4e1c-9117-44d003f5d7fc",
        single_account_select: undefined,
        updated: true,
        user_id: "test_user_id",
      });
    });
});
