import { describe, expect, it } from "vitest";
import { instrumentation } from "./api";
import server from "../shared/test/testServer";
import { http, HttpResponse } from "msw";
import { ComboJobTypes, INSTRUMENTATION_MOCK_URL } from "@repo/utils";

const instrumentationProps = {
  jobTypes: [ComboJobTypes.TRANSACTIONS],
  userId: "test",
};

describe("api", () => {
  describe("instrumentation", () => {
    it("resolves", async () => {
      await instrumentation(instrumentationProps);
    });

    it("throws an error on failure", async () => {
      server.use(
        http.post(
          INSTRUMENTATION_MOCK_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(instrumentation(instrumentationProps)).rejects.toThrow();
    });
  });
});
