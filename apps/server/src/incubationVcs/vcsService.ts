import * as logger from '../infra/logger'
import {
  type Institution
} from '../shared/contract'

import { ProviderAdapterBase } from '../adapters'

export class VcsService extends ProviderAdapterBase {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (req: any) {
    super(req)
  }

  async selectInstitution (
    institution: Institution
  ) {
    logger.debug(`Selecting institution ${institution.id}`)
    // if (institution.provider) {
    //   context.provider = institution.provider;
    // }
    // if (!context.provider) {
    //   context.provider = 'sophtron';
    // }
    if (institution.id) {
      institution = await this.getInstitution(institution.id)
      const credentials = await this.getInstitutionCredentials(institution.id)
      return { institution, credentials }
    }
    return { error: 'invalid institution selected' }
  }

  async login (
    // eslint-disable-next-line @typescript-eslint/naming-convention
    institution_id: string,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    connection_id: string | null,
    credentials: Credential[]
  ) {
    institution_id = this.context.institution_id || institution_id
    connection_id = this.context.connection_id || connection_id
    if (connection_id) {
      const res = await this.updateConnection(
        {
          id: connection_id,
          credentials
        }
      )
      return res
    }
    if (institution_id) {
      const res = await this.createConnection(
        {
          institution_id,
          credentials,
          initial_job_type: this.context.job_type
        }
      )
      if (res) {
        return res
      }
      logger.error(
        `failed creating connection with instituionId : ${institution_id}`
      )
      return {
        error: `failed creating connection with instituionId : ${institution_id}`
      }
    }
    return { error: 'Unable to find instituion, invalid parameters provided' }
  }

  async mfa (id: string) {
    const res = await this.getConnectionStatus(id)
    if (!res) {
      logger.warning(`Mfa failed to find connection with Id: ${id}`)
      return { error: 'Failed to find job' }
    }
    res.provider = this.context.provider
    return res
  }
}
