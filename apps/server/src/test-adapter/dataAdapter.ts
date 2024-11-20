import { getDataFromVCJwt, type VCDataTypes } from "@repo/utils";
import { getVC } from "./vc";

export const dataAdapter = ({ type }: { type: VCDataTypes }) => {
  return getDataFromVCJwt(getVC({ type }));
};
