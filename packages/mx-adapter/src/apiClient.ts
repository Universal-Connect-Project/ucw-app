import { Configuration, MxPlatformApiFactory } from "mx-platform-node";

import type { ApiCredentials } from "./models";

export const BASE_PATH = "https://api.mx.com".replace(/\/+$/, "");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MxProdApiClient: any = (aggregatorCredentials: ApiCredentials) => MxPlatformApiFactory(
  new Configuration({
    ...aggregatorCredentials.mxProd,
    baseOptions: {
      headers: {
        Accept: "application/vnd.mx.api.v2beta+json"
      }
    }
  })
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MxIntApiClient: any = (aggregatorCredentials: ApiCredentials) => MxPlatformApiFactory(
  new Configuration({
    ...aggregatorCredentials.mxInt,
    baseOptions: {
      headers: {
        Accept: "application/vnd.mx.api.v2beta+json"
      }
    }
  })
);
