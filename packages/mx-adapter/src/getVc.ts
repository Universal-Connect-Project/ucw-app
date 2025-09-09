import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

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

  const axiosConfigured = envConfig.PROXY_HOST
    ? axios.create({
        httpsAgent: new HttpsProxyAgent(
          `http://${envConfig.PROXY_USERNAME}:${envConfig.PROXY_PASSWORD}@${envConfig.PROXY_HOST}:${envConfig.PROXY_PORT}`,
        ),
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
