import type { CachedInstitution } from '../../shared/contract'

export function cachedInstitution (
  mxId: string | null,
  sophtronId: string | null,
  finicityId: string | null,
  akoyaId: string | null
): CachedInstitution {
  return {
    name: '',
    keywords: '',
    logo: '',
    url: '',
    ucp_id: '',
    is_test_bank: false,
    mx: {
      id: mxId,
      supports_oauth: false,
      supports_identification: false,
      supports_verification: false,
      supports_account_statement: false,
      supports_history: false
    },
    sophtron: {
      id: sophtronId,
      supports_oauth: false,
      supports_identification: false,
      supports_verification: false,
      supports_account_statement: false,
      supports_history: false
    },
    finicity: {
      id: finicityId,
      supports_oauth: false,
      supports_identification: false,
      supports_verification: false,
      supports_account_statement: false,
      supports_history: false
    },
    akoya: {
      id: akoyaId,
      supports_oauth: false,
      supports_identification: false,
      supports_verification: false,
      supports_account_statement: false,
      supports_history: false
    }
  }
}
