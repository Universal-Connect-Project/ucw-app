import { describe, expect, it } from "vitest";
import connectWidgetApiService, {
  RECOMMENDED_INSTITUTIONS_URL,
} from "./connectWidgetApiService";
import { recommendedInstitutions } from "../shared/test/testData/recommendedInstitutions";
import server from "../shared/test/testServer";
import { http, HttpResponse } from "msw";

describe("connectWidgetApiService", () => {
  describe("loadPopularInstitutions", () => {
    it("resolves with popular institutions", async () => {
      expect(await connectWidgetApiService.loadPopularInstitutions()).toEqual(
        recommendedInstitutions,
      );
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          RECOMMENDED_INSTITUTIONS_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.loadPopularInstitutions(),
      ).rejects.toThrow();
    });
  });
});
