import axios from "axios";

import { vcEndpoint } from "./consts";
import type { AdapterDependencies, VCDependencies } from "./models";
import { buildSophtronAuthCode } from "./utils";
import SophtronClient from "./apiClient.v1";

interface VcResponse {
  vc: string;
}

export const getVc = async (
  path: string,
  args: VCDependencies,
  params?: { startTime: string; endTime: string },
) => {
  const { aggregatorCredentials } = args;
  const { clientId, secret } = aggregatorCredentials;

  const sophtronClient = new SophtronClient(args as AdapterDependencies);

  const res = await sophtronClient.getUserIntegrationKey();
  const headers = {
    IntegrationKey: res.IntegrationKey,
    Authorization: buildSophtronAuthCode("get", path, clientId, secret),
  };

  const ret: VcResponse = (
    await axios({
      url: `${vcEndpoint}/vc/${path}`,
      method: "get",
      headers,
      params,
    })
  ).data;

  return ret?.vc;
};
