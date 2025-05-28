import axios from "mx-platform-node/node_modules/axios";

import { basePathInt, basePathProd } from "./consts";
import type { VCDependencies } from "./models";

export const getVC = async (
  path: string,
  isProd: boolean,
  dependencies: VCDependencies,
  params?: { startTime?: string; endTime?: string },
): Promise<any> => {
  const { logClient, aggregatorCredentials, envConfig } = dependencies;

  const configuration = isProd
    ? aggregatorCredentials.mxProd
    : aggregatorCredentials.mxInt;

  const authHeader =
    "Basic " +
    Buffer.from(configuration.username + ":" + configuration.password).toString(
      "base64",
    );

  const url = `${isProd ? basePathProd : basePathInt}/vc/${path}`;

  const axiosConfigured = dependencies?.envConfig.PROXY_HOST
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
    : axios;

  return axiosConfigured({
    url,
    headers: {
      Accept: "application/vnd.mx.api.v1beta+json",
      "content-type": "application/json",
      Authorization: authHeader,
    },
    params,
  })
    .then((res) => {
      logClient.debug(
        `mx vc client http response status ${res.status} from ${url}`,
      );
      return res.data?.verifiableCredential;
    })
    .catch((err) => {
      logClient.error(
        `mx vc client http response status ${err.response?.status} from ${url}`,
        err.response?.data || err,
      );

      throw new Error("MX VC endpoint failure");
    });
};
