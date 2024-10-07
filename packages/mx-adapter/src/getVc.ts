import get from "axios";
import type { VCDependencies } from "./models";

export const getVC = async (path: string, isProd: boolean, dependencies: VCDependencies): Promise<any> => {
  const { logClient, aggregatorCredentials } = dependencies;

  const configuration = isProd
    ? aggregatorCredentials.mxProd
    : aggregatorCredentials.mxInt;

  const authHeader =
    "Basic " +
    Buffer.from(configuration.username + ":" + configuration.password).toString(
      "base64"
    );

  const url = `${configuration.basePath}/vc/${path}`;

  return get({
    url,
    headers: {
      Accept: "application/vnd.mx.api.v1beta+json",
      "content-type": "application/json",
      Authorization: authHeader
    }
  })
    .then((res) => {
      logClient.debug(`mx vc client http response status ${res.status} from ${url}`);
      return res.data?.verifiableCredential;
    })
    .catch((err) => {
      logClient.error(
        `mx vc client http response status ${err.response?.status} from ${url}`,
        err.response?.data || err
      );

      throw new Error("MX VC endpoint failure");
    });
};
