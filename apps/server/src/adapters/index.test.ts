import { OAuthStatus } from "@repo/utils";
import { ConnectionStatus } from "../shared/contract";
import { AggregatorAdapterBase } from "./index";
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
  describe("getShouldRecordPerformanceDuration", () => {
    it("returns true if the adapter does not implement getShouldRecordPerformanceDuration", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {};
      expect(aggregatorAdapterBase.getShouldRecordPerformanceDuration()).toBe(
        true,
      );
    });

    it("returns the value from the adapter's getShouldRecordPerformanceDuration if implemented (true)", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        getShouldRecordPerformanceDuration: jest.fn().mockReturnValue(true),
      };
      expect(aggregatorAdapterBase.getShouldRecordPerformanceDuration()).toBe(
        true,
      );
    });

    it("returns the value from the adapter's getShouldRecordPerformanceDuration if implemented (false)", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        getShouldRecordPerformanceDuration: jest.fn().mockReturnValue(false),
      };
      expect(aggregatorAdapterBase.getShouldRecordPerformanceDuration()).toBe(
        false,
      );
    });
  });

  describe("getRequiresPollingForPerformance", () => {
    it("returns true if the adapter does not implement getRequiresPollingForPerformance", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {};
      expect(aggregatorAdapterBase.getRequiresPollingForPerformance()).toBe(
        true,
      );
    });

    it("returns the value from the adapter's getRequiresPollingForPerformance if implemented (true)", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        requiresPollingForPerformance: true,
      };
      expect(aggregatorAdapterBase.getRequiresPollingForPerformance()).toBe(
        true,
      );
    });

    it("returns the value from the adapter's getRequiresPollingForPerformance if implemented (false)", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        requiresPollingForPerformance: false,
      };
      expect(aggregatorAdapterBase.getRequiresPollingForPerformance()).toBe(
        false,
      );
    });
  });

  describe("getPerformanceEnabled", () => {
    it("returns true if the adapter does not implement getPerformanceEnabled", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {};
      expect(aggregatorAdapterBase.getPerformanceEnabled()).toBe(true);
    });

    it("returns the value from the adapter's getPerformanceEnabled if implemented (true)", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        performanceEnabled: true,
      };
      expect(aggregatorAdapterBase.getPerformanceEnabled()).toBe(true);
    });

    it("returns the value from the adapter's getPerformanceEnabled if implemented (false)", async () => {
      await aggregatorAdapterBase.init();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (aggregatorAdapterBase as any).aggregatorAdapter = {
        performanceEnabled: false,
      };
      expect(aggregatorAdapterBase.getPerformanceEnabled()).toBe(false);
    });
  });

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
});
