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
});
