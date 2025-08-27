import type { Request } from "express";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { getShouldRecordPerformanceDuration } from "./performance";
import { PLAID_AGGREGATOR_STRING } from "@repo/plaid-adapter";

describe("performance utils", () => {
  describe("getShouldRecordPerformanceDuration", () => {
    it("returns true if the adapter does not implement getShouldRecordPerformanceDuration", async () => {
      const req = {
        context: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getShouldRecordPerformanceDuration(req)).toBe(true);
    });

    it("returns the value from the adapter's getShouldRecordPerformanceDuration if implemented", async () => {
      const req = {
        context: {
          aggregator: PLAID_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getShouldRecordPerformanceDuration(req)).toBe(false);
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
});
