import { Configuration, MxPlatformApiFactory } from "mx-platform-node";
import { HttpsProxyAgent } from "https-proxy-agent";
import { basePathInt, basePathProd } from "./consts";
import type { ApiCredentials } from "./models";
import axios from "axios";

export const BASE_PATH = "https://api.mx.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MxProdApiClient: any = ({
  aggregatorCredentials,
  envConfig,
}: {
  aggregatorCredentials: ApiCredentials;
  envConfig?: Record<string, string>;
}) => {
  const axiosWithProxy = envConfig?.PROXY_HOST
    ? axios.create({
        httpsAgent: new HttpsProxyAgent(
          `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
        ),
      })
    : undefined;

  return MxPlatformApiFactory(
    new Configuration({
      ...aggregatorCredentials,
      basePath: basePathProd,
      baseOptions: {
        headers: {
          Accept: "application/vnd.mx.api.v2beta+json",
        },
      },
    }),
    basePathProd,
    axiosWithProxy,
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MxIntApiClient: any = (aggregatorCredentials: ApiCredentials) =>
  MxPlatformApiFactory(
    new Configuration({
      ...aggregatorCredentials,
      basePath: basePathInt,
      baseOptions: {
        headers: {
          Accept: "application/vnd.mx.api.v2beta+json",
        },
      },
    }),
  );
