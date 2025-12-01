import { decode, type JwtPayload } from "jsonwebtoken";
import path from "path";
import fs from "fs";
import sanitize from "sanitize-filename";

const fetchNewToken = async ({
  audience,
  clientId,
  clientSecret,
  domain,
}: {
  audience: string;
  clientId: string;
  clientSecret: string;
  domain: string;
}) => {
  const response = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Auth0 token request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  const expiresInMs = data.expires_in * 1000;

  const accessToken = data.access_token;

  return { accessToken, expiresInMs };
};

const getAvailableToken = async ({
  getTokenFromCache,
  localToken,
  tokenFilePath,
}: {
  audience: string;
  domain: string;
  getTokenFromCache?: () => Promise<string | null>;
  localToken: string | null;
  tokenFilePath: string;
}) => {
  const getTokenIfUnexpired = (token: string | null) => {
    if (!token) {
      return null;
    }

    try {
      const { exp } = decode(token, { json: true }) as JwtPayload;

      const oneSecondInMs = 1000;

      const willTokenExpireSoon =
        !exp || Date.now() >= exp * oneSecondInMs - 60000;

      if (willTokenExpireSoon) {
        return null;
      }

      return token;
    } catch (_error) {
      return null;
    }
  };

  const tokenGetters = [
    async () => localToken,
    async () => {
      try {
        return fs.readFileSync(tokenFilePath, "utf8");
      } catch {
        return null;
      }
    },
  ];

  if (getTokenFromCache) {
    tokenGetters.push(getTokenFromCache);
  }

  for (const getToken of tokenGetters) {
    const token = await getToken();
    const validToken = getTokenIfUnexpired(token);

    if (validToken) {
      localToken = validToken;
      return validToken;
    }
  }

  return null;
};

export const createM2MTokenHandler = ({
  audience,
  clientId,
  clientSecret,
  fileName,
  getTokenFromCache,
  domain,
  setTokenInCache,
}: {
  audience: string;
  clientId: string;
  clientSecret: string;
  domain: string;
  fileName: string;
  getTokenFromCache?: () => Promise<string | null>;
  setTokenInCache?: (tokenData: {
    expireIn: number;
    token: string;
  }) => Promise<void>;
}) => {
  let localToken: string | null = null;

  const clearLocalToken = () => {
    localToken = null;
  };

  const getLocalToken = () => localToken;

  const isTestEnvironment = process.env.NODE_ENV === "test";

  const tokenStorageFolderPath = path.join(
    __dirname,
    `tokenStorage`,
    isTestEnvironment ? "test" : "prod",
  );

  const tokenFileName: string = sanitize(
    `${domain}-${audience}-${clientId}-${fileName}.txt`,
  );
  const tokenFilePath: string = path.join(
    tokenStorageFolderPath,
    tokenFileName,
  );

  const clearTokenFiles = () => {
    if (fs.existsSync(tokenStorageFolderPath)) {
      fs.rmSync(tokenStorageFolderPath, { recursive: true, force: true });
    }
  };

  const storeTokenEverywhere = async ({
    token,
    expiresInMs,
  }: {
    token: string;
    expiresInMs: number;
  }) => {
    localToken = token;

    if (!fs.existsSync(tokenStorageFolderPath)) {
      fs.mkdirSync(tokenStorageFolderPath, { recursive: true });
    }

    fs.writeFileSync(tokenFilePath, token);

    await setTokenInCache?.({
      expireIn: expiresInMs,
      token,
    });
  };

  const getToken = async (): Promise<string> => {
    const availableToken = await getAvailableToken({
      audience,
      domain,
      getTokenFromCache,
      localToken,
      tokenFilePath,
    });

    if (availableToken) {
      return availableToken;
    }

    const { accessToken: newAccessToken, expiresInMs } = await fetchNewToken({
      audience,
      clientId,
      clientSecret,
      domain,
    });

    await storeTokenEverywhere({
      expiresInMs,
      token: newAccessToken,
    });

    return newAccessToken;
  };

  return {
    clearLocalToken,
    clearTokenFiles,
    getLocalToken,
    getToken,
    tokenFilePath,
  };
};
