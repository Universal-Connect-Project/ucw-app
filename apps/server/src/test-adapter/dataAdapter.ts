import { getDataFromVCJwt, type VCAdapterInput } from "@repo/utils";
import { getVC } from "./vc";

export const dataAdapter = ({
  type,
  connectionId,
}: Partial<VCAdapterInput>) => {
  return getDataFromVCJwt(getVC({ type, connectionId }));
};
