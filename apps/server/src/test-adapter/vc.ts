import { type VCAdapterInput, VCDataTypes } from "@repo/utils";
import {
  accountsResponse,
  identityResponse,
  transactionsResponse,
  transcationsByConnectionData
} from "./vcResponses";

export const getVC = ({ type, connectionId }: Partial<VCAdapterInput>) => {
  switch (type) {
    case VCDataTypes.ACCOUNTS:
      return accountsResponse;
    case VCDataTypes.IDENTITY:
      return identityResponse;
    case VCDataTypes.TRANSACTIONS:
      return connectionId === 'testId' ? transcationsByConnectionData : transactionsResponse;
  }
};
