import { VCAdapterInput, VCDataTypes } from "@repo/utils";
import {
  accountsResponse,
  identityResponse,
  transactionsResponse,
} from "./vcResponses";

export const getVC = ({ type }: Partial<VCAdapterInput>) => {
  switch (type) {
    case VCDataTypes.ACCOUNTS:
      return accountsResponse;
    case VCDataTypes.IDENTITY:
      return identityResponse;
    case VCDataTypes.TRANSACTIONS:
      return transactionsResponse;
  }
};
