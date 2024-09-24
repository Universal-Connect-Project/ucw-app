import { VCDataTypes } from 'packages/utils'
import {
  accountsResponse,
  identityResponse,
  transactionsResponse
} from 'packages/mx-adapter/src/vcResponses'

export const getVC = ({ type }: { type: VCDataTypes }) => {
  switch (type) {
    case VCDataTypes.ACCOUNTS:
      return accountsResponse

    case VCDataTypes.IDENTITY:
      return identityResponse
    case VCDataTypes.TRANSACTIONS:
      return transactionsResponse
  }
}
