import { describe, expect, it } from "vitest";
import { instrumentation, INSTRUMENTATION_URL } from "./api";
import server from "../shared/test/testServer";
import { http, HttpResponse } from "msw";

const instrumentationProps = {
  job_type: "test",
  user_id: "test",
};

describe("api", () => {
  describe("instrumentation", () => {
    it("resolves", async () => {
      await instrumentation(instrumentationProps);
    });

    it("throws an error on failure", async () => {
      server.use(
        http.post(
          INSTRUMENTATION_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(instrumentation(instrumentationProps)).rejects.toThrow();
    });
  });
});
