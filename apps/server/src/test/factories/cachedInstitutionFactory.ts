import type { CachedInstitution } from '../../shared/contract'

export class CachedInstitutionFactory {
  mxId?: string | null
  sophtronId?: string | null
  finicityId?: string | null
  akoyaId?: string | null

  constructor (mxId: string | null, sophtronId: string | null, finicityId: string | null, akoyaId: string | null) {
    this.mxId = mxId
    this.sophtronId = sophtronId
    this.finicityId = finicityId
    this.akoyaId = akoyaId
  }

  instance (): CachedInstitution {
    return {
      name: '',
      keywords: '',
      logo: '',
      url: '',
      ucp_id: '',
      is_test_bank: false,
      mx: {
        id: this.mxId,
        supports_oauth: false,
        supports_identification: false,
        supports_verification: false,
        supports_account_statement: false,
        supports_history: false
      },
      sophtron: {
        id: this.sophtronId,
        supports_oauth: false,
        supports_identification: false,
        supports_verification: false,
        supports_account_statement: false,
        supports_history: false
      },
      finicity: {
        id: this.finicityId,
        supports_oauth: false,
        supports_identification: false,
        supports_verification: false,
        supports_account_statement: false,
        supports_history: false
      },
      akoya: {
        id: this.akoyaId,
        supports_oauth: false,
        supports_identification: false,
        supports_verification: false,
        supports_account_statement: false,
        supports_history: false
      }
    }
  }
}
