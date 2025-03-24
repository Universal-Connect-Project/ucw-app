import { getDataFromVCJwt } from "@repo/utils";

import { createSophtronVC, type DataParameters } from "./createVc";
import { type VCDependencies } from "./models";

export const createDataAdapter = (dependencies: VCDependencies) => {
  const getVC = createSophtronVC(dependencies);

  return async (params: DataParameters) =>
    getDataFromVCJwt(await getVC(params));
};
