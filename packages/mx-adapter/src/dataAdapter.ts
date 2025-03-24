import { getDataFromVCJwt } from "@repo/utils";
import {
  createMxIntGetVC,
  createMxProdGetVC,
  type DataParameters,
} from "./createVc";
import type { VCDependencies } from "./models";

const createDataAdapter = (isProd: boolean, dependencies: VCDependencies) => {
  const getVC = isProd
    ? createMxProdGetVC(dependencies)
    : createMxIntGetVC(dependencies);

  return async (params: DataParameters) =>
    getDataFromVCJwt(await getVC(params));
};

export const createMxProdDataAdapter = (dependencies: VCDependencies) =>
  createDataAdapter(true, dependencies);
export const createMxIntDataAdapter = (dependencies: VCDependencies) =>
  createDataAdapter(false, dependencies);
