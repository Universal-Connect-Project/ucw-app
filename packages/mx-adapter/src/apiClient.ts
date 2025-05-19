import { Configuration, MxPlatformApiFactory } from "mx-platform-node";

import axios from "mx-platform-node/node_modules/axios";
import { basePathInt, basePathProd } from "./consts";
import type { ApiCredentials } from "./models";

export const BASE_PATH = "https://api.mx.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MxProdApiClient: any = ({
  aggregatorCredentials,
  envConfig,
}: {
  aggregatorCredentials: ApiCredentials;
  envConfig?: Record<string, string>;
}) => {
  const axiosWithProxy = envConfig.PROXY_HOST
    ? axios.create({
        proxy: {
          host: envConfig.PROXY_HOST,
          port: parseInt(envConfig.PROXY_PORT),
          auth: {
            username: envConfig.PROXY_USERNAME,
            password: envConfig.PROXY_PASSWORD,
          },
        },
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
