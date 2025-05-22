import type { DataAdapterRequestParams } from "@repo/utils";
import { getDataFromVCJwt } from "@repo/utils";

import { createSophtronVC } from "./createVc";
import { type VCDependencies } from "./models";

export const createDataAdapter = (dependencies: VCDependencies) => {
  const getVC = createSophtronVC(dependencies);

  return async (params: DataAdapterRequestParams) =>
    getDataFromVCJwt(await getVC(params));
};
