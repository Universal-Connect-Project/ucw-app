import { http, HttpResponse } from "msw";
import { server } from "../../test/testServer";
import { createFakeAccessToken } from "./test/createFakeAccessToken";
import { getUCPAccessToken, m2mTokenHandler } from "./ucpAccessToken";
import { FETCH_ACCESS_TOKEN_URL } from "../../test/handlers";

describe("ucpAccessToken", () => {
  it("retrieves token from the api and then from the redis cache", async () => {
    const validAccessToken = createFakeAccessToken({ expiresInSeconds: 120 });

    server.use(
      http.post(FETCH_ACCESS_TOKEN_URL, () =>
        HttpResponse.json({
          access_token: validAccessToken,
          expires_in: 86400,
        }),
      ),
    );

    const token = await getUCPAccessToken();

    expect(token).toEqual(validAccessToken);

    m2mTokenHandler.clearLocalToken();
    m2mTokenHandler.clearTokenFiles();

    server.use(
      http.post(FETCH_ACCESS_TOKEN_URL, () =>
        HttpResponse.json({
          access_token: "differentToken",
          expires_in: 86400,
        }),
      ),
    );

    const cachedToken = await getUCPAccessToken();

    expect(cachedToken).toEqual(validAccessToken);
  });
});
