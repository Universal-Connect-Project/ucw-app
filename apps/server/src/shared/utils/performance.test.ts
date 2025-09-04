import type { Request } from "express";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import {
  getRequiresPollingForPerformance,
  getShouldRecordPerformance,
  getShouldRecordPerformanceDuration,
} from "./performance";
import { PLAID_AGGREGATOR_STRING } from "@repo/plaid-adapter";

describe("performance utils", () => {
  describe("getShouldRecordPerformanceDuration", () => {
    it("returns true if the adapter does not implement shouldRecordPerformanceDuration", async () => {
      const req = {
        context: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getShouldRecordPerformanceDuration(req)).toBe(true);
    });

    it("returns the value from the adapter's shouldRecordPerformanceDuration if implemented", async () => {
      const req = {
        context: {
          aggregator: PLAID_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getShouldRecordPerformanceDuration(req)).toBe(false);
    });
  });

  describe("getShouldRecordPerformance", () => {
    it("returns false if the adapter doesn't implement shouldRecordPerformanceDuration but it's a refresh", () => {
      const req = {
        context: {
          aggregator: MX_AGGREGATOR_STRING,
          connectionId: "test",
        },
      } as Request;

      expect(getShouldRecordPerformance(req)).toBe(false);
    });

    it("returns true if the adapter does not implement shouldRecordPerformance", async () => {
      const req = {
        context: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getShouldRecordPerformance(req)).toBe(true);
    });

    it("returns the value from the adapter's shouldRecordPerformance if implemented (false)", async () => {
      const req = {
        context: {
          aggregator: PLAID_AGGREGATOR_STRING,
        },
      } as Request;
      expect(getShouldRecordPerformance(req)).toBe(false);
    });
  });

  describe("getRequiresPollingForPerformance", () => {
    it("returns true if the adapter does not implement requiresPollingForPerformance", async () => {
      const req = {
        context: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getRequiresPollingForPerformance(req)).toBe(true);
    });

    it("returns the value from the adapter's requiresPollingForPerformance if implemented (false)", async () => {
      const req = {
        context: {
          aggregator: PLAID_AGGREGATOR_STRING,
        },
      } as Request;

      expect(getRequiresPollingForPerformance(req)).toBe(false);
    });
  });
});
