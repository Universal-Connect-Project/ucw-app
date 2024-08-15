import type { Member, MemberResponse } from 'interfaces/contract'
import * as logger from '../infra/logger'
import type { Challenge } from '../shared/contract'
import { ChallengeType } from '../shared/contract'

import { ProviderAdapterBase } from '../adapters'
import { mapConnection } from '../utils'

export class ConnectApi extends ProviderAdapterBase {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(req: any) {
    super(req)
  }

  async addMember(memberData: Member): Promise<MemberResponse> {
    const connection = await this.createConnection({
      institution_id: memberData.institution_guid,
      is_oauth: memberData.is_oauth ?? false,
      skip_aggregation:
        (memberData.skip_aggregation ?? false) &&
        (memberData.is_oauth ?? false),
      initial_job_type: this.context.job_type ?? 'aggregate',
      credentials:
        memberData.credentials?.map((c) => ({
          id: c.guid,
          value: c.value
        })) ?? []
    })
    return { member: mapConnection(connection) }
  }

  async updateMember(member: Member): Promise<MemberResponse> {
    if (this.context.current_job_id && member.credentials !== undefined) {
      await this.answerChallenge(
        member.guid,
        member.credentials.map((c) => {
          const ret: Challenge = {
            id: c.guid,
            type: c.field_type,
            response: c.value
          }
          const challenge = member.mfa?.credentials.find(
            (m) => m.guid === c.guid
          ) // widget posts everything back
          switch (challenge?.type) {
            case 0:
              ret.type = ChallengeType.QUESTION
              break
            case 13:
              ret.type = ChallengeType.IMAGE
              break
            case 2:
              ret.type = c.value ? ChallengeType.OPTIONS : ChallengeType.TOKEN
              if (c.value) {
                ret.response = challenge?.options.find(
                  (o: any) => o.guid === c.value
                )?.value
                if (!ret.response) {
                  logger.error(
                    `Unexpected challege option: ${c.value}: `,
                    challenge
                  )
                }
              }
              break
          }
          return ret
        })
      )
      return { member }
    } else {
      const connection = await this.updateConnection({
        job_type: this.context.job_type,
        id: member.guid,
        credentials: member.credentials?.map((c) => ({
          id: c.guid,
          value: c.value
        }))
      })
      return { member: mapConnection(connection) }
    }
  }

  async loadMembers(): Promise<Member[]> {
    if (
      this.context.connection_id != null &&
      this.context.connection_id !== ''
    ) {
      const focusedMember = await this.getConnection(this.context.connection_id)
      return [mapConnection(focusedMember)]
    }
    return []
  }

  async loadMemberByGuid(memberGuid: string): Promise<MemberResponse> {
    const mfa = await this.getConnectionStatus(memberGuid)
    if (mfa?.institution_code == null) {
      const connection = await this.getConnection(memberGuid)
      return { member: mapConnection({ ...mfa, ...connection }) }
    }
    return { member: mapConnection({ ...mfa }) }
  }

  async getOauthWindowUri(memberGuid: string) {
    const ret = await this.loadMemberByGuid(memberGuid)
    return ret?.member?.oauth_window_uri
  }

  async deleteMember(member: Member): Promise<void> {
    await this.deleteConnection(member.guid)
  }

  async getMemberCredentials(memberGuid: string): Promise<any> {
    const crs = await this.getConnectionCredentials(memberGuid)
    return {
      credentials: crs.map((c) => ({
        ...c,
        guid: c.id,
        field_type: c.field_type === 'PASSWORD' ? 1 : 3
      }))
    }
  }
}
