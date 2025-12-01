import fs from "fs";
import { createM2MTokenHandler } from "./m2mToken";
import { m2mAccessTokenResponse } from "./test/testData/m2mAccessToken";
import { http, HttpResponse } from "msw";
import { createFakeAccessToken } from "./test/createFakeAccessToken";
import { server } from "../../test/testServer";
import { FETCH_ACCESS_TOKEN_URL } from "../../test/handlers";
import config from "../../config";

describe("m2mToken", () => {
  describe("createM2MTokenHandler", () => {
    let cacheObject: Record<string, string> = {};

    const getTokenFromCache = async (): Promise<string | null> => {
      return cacheObject["token"] || null;
    };

    const setTokenInCache = async (tokenData: {
      expireIn: number;
      token: string;
    }) => {
      if (!tokenData.expireIn) {
        throw new Error("expireIn is required to set token in cache");
      }

      cacheObject["token"] = tokenData.token;
    };

    const clearCache = () => {
      cacheObject = {};
    };

    let m2mTokenHandler: {
      clearLocalToken: () => void;
      clearTokenFiles: () => void;
      getLocalToken: () => string | null;
      getToken: () => Promise<string | null>;
      tokenFilePath: string;
    };
    let validAccessToken: string;

    const prepareTokenSuccess = () => {
      validAccessToken = createFakeAccessToken({ expiresInSeconds: 120 });

      server.use(
        http.post(FETCH_ACCESS_TOKEN_URL, () =>
          HttpResponse.json({
            access_token: validAccessToken,
            expires_in: 86400,
          }),
        ),
      );
    };

    const prepareDifferentToken = () => {
      server.use(
        http.post(FETCH_ACCESS_TOKEN_URL, () =>
          HttpResponse.json({
            access_token: "junkToken",
            expires_in: 86400,
          }),
        ),
      );
    };

    beforeEach(async () => {
      m2mTokenHandler = createM2MTokenHandler({
        audience: "https://api.example.com",
        domain: config.UCP_AUTH0_DOMAIN,
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
        fileName: "test-token",
        getTokenFromCache,
        setTokenInCache,
      });

      m2mTokenHandler.clearTokenFiles();

      clearCache();
    });

    it("should fetch a new token if the first one is junk", async () => {
      const junkAccessToken = "junkToken";

      server.use(
        http.post(FETCH_ACCESS_TOKEN_URL, () =>
          HttpResponse.json({
            access_token: junkAccessToken,
            expires_in: 86400,
          }),
        ),
      );

      const firstToken = await m2mTokenHandler.getToken();

      expect(firstToken).toBe(junkAccessToken);

      prepareTokenSuccess();

      const secondToken = await m2mTokenHandler.getToken();

      expect(secondToken).toBe(validAccessToken);
    });

    it("should fetch a new token when no token is available and store it in a local variable, a cache, and a file", async () => {
      expect(fs.existsSync(m2mTokenHandler.tokenFilePath)).toBe(false);
      expect(await getTokenFromCache()).toBeNull();

      expect(m2mTokenHandler.getLocalToken()).toBeNull();

      const token = await m2mTokenHandler.getToken();

      expect(token).toBe(m2mAccessTokenResponse.access_token);

      const file = fs.readFileSync(m2mTokenHandler.tokenFilePath, "utf-8");

      expect(file).toEqual(m2mAccessTokenResponse.access_token);

      expect(await getTokenFromCache()).toEqual(
        m2mAccessTokenResponse.access_token,
      );
    });

    it("should fetch a new token if the local token will expire in less than 60 seconds", async () => {
      const expiredAccessToken = createFakeAccessToken({
        expiresInSeconds: 59,
      });

      server.use(
        http.post(FETCH_ACCESS_TOKEN_URL, () =>
          HttpResponse.json({
            access_token: expiredAccessToken,
            expires_in: 59,
          }),
        ),
      );

      const firstToken = await m2mTokenHandler.getToken();

      expect(firstToken).toBe(expiredAccessToken);

      const validAccessToken = createFakeAccessToken({ expiresInSeconds: 120 });

      server.use(
        http.post(FETCH_ACCESS_TOKEN_URL, () =>
          HttpResponse.json({
            access_token: validAccessToken,
            expires_in: 86400,
          }),
        ),
      );

      const secondToken = await m2mTokenHandler.getToken();

      expect(secondToken).toBe(validAccessToken);
    });

    it("should return the local token if it is available and not expired", async () => {
      prepareTokenSuccess();

      const firstToken = await m2mTokenHandler.getToken();

      expect(firstToken).toBe(validAccessToken);

      m2mTokenHandler.clearTokenFiles();
      clearCache();

      prepareDifferentToken();

      const secondToken = await m2mTokenHandler.getToken();

      expect(secondToken).toBe(validAccessToken);
    });

    it("should returns the cached token if it is available and not expired", async () => {
      prepareTokenSuccess();

      const firstToken = await m2mTokenHandler.getToken();
      expect(firstToken).toBe(validAccessToken);

      m2mTokenHandler.clearLocalToken();
      m2mTokenHandler.clearTokenFiles();

      prepareDifferentToken();

      const secondToken = await m2mTokenHandler.getToken();
      expect(secondToken).toBe(validAccessToken);
    });

    it("should return the file token if it is available and not expired", async () => {
      prepareTokenSuccess();

      const firstToken = await m2mTokenHandler.getToken();

      expect(firstToken).toBe(validAccessToken);

      m2mTokenHandler.clearLocalToken();
      clearCache();

      prepareDifferentToken();

      const secondToken = await m2mTokenHandler.getToken();

      expect(secondToken).toBe(validAccessToken);
    });
  });
});
