import { describe, expect, it } from "vitest";
import configuredAxios from "./axios";
import server from "../shared/test/testServer";
import { http, HttpResponse } from "msw";

describe("configuredAxios", () => {
  it("stores the meta property if it exists on success and uses it on subsequent requests", async () => {
    let metaRequestHeader;

    const testMeta = "test";

    const testUrl = "/test";

    server.use(
      http.get(testUrl, ({ request }) => {
        metaRequestHeader = request.headers.get("meta");

        return HttpResponse.json(
          {},
          {
            headers: {
              meta: testMeta,
            },
          },
        );
      }),
    );

    await configuredAxios.get(testUrl);

    expect(metaRequestHeader).toBeNull();

    await configuredAxios.get(testUrl);

    expect(metaRequestHeader).toEqual(testMeta);
  });
});
