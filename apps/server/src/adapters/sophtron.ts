import providerCredentials from '../providerCredentials'
import type {
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter
} from '../shared/contract'
import { ChallengeType, ConnectionStatus, JobTypes } from '../shared/contract'
import { mapJobType } from '../utils'

import { debug, error, trace } from '../infra/logger'
import SophtronClientV1 from '../providerApiClients/sophtronClient'
import SophtronClient from '../providerApiClients/sophtronClient/v2'

function fromSophtronInstitution(ins: any): Institution | undefined {
  if (!ins) {
    return undefined
  }
  return {
    id: ins.InstitutionID,
    logo_url: ins.Logo,
    name: ins.InstitutionName,
    url: ins.URL,
    provider: 'sophtron'
  }
}

export class SophtronAdapter implements WidgetAdapter {
  apiClient: any
  apiClientV1: any

  constructor() {
    this.apiClient = new SophtronClient(providerCredentials.sophtron)
    this.apiClientV1 = new SophtronClientV1(providerCredentials.sophtron)
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    const ins = await this.apiClientV1.getInstitutionById(id)
    return fromSophtronInstitution(ins)
  }

  async ListInstitutionCredentials(id: string): Promise<Credential[]> {
    const ins = await this.apiClientV1.getInstitutionById(id)
    const ret = [
      {
        id: 'username',
        label: ins?.InstitutionDetail?.LoginFormUserName ?? 'User name',
        field_type: 'LOGIN',
        field_name: 'LOGIN'
      }
    ]
    if (ins?.InstitutionDetail?.LoginFormPassword !== 'None') {
      ret.push({
        id: 'password',
        label: ins?.InstitutionDetail?.LoginFormPassword ?? 'Password',
        field_type: 'PASSWORD',
        field_name: 'PASSWORD'
      })
    }
    return ret
  }

  async ListConnectionCredentials(
    connectionId: string,
    userId: string
  ): Promise<Credential[]> {
    const uins = await this.apiClient.getMember(userId, connectionId)
    if (uins) {
      return await this.ListInstitutionCredentials(uins.InstitutionID)
    }
    return []
  }

  async ListConnections(): Promise<Connection[]> {
    return []
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId: string
  ): Promise<Connection | undefined> {
    const jobType = request.initial_job_type
    if (jobType == null) {
      return
    }
    const username = request.credentials.find(
      (item) => item.id === 'username'
    ).value
    const passwordField = request.credentials.find(
      (item) => item.id === 'password'
    )
    // if password field wasn't available, it should be a 'none' type
    const password = passwordField ? passwordField.value : 'None'
    const ret = await this.apiClient.createMember(
      userId,
      jobType,
      username,
      password,
      request.institution_id
    )
    if (ret) {
      return {
        id: ret.MemberID,
        cur_job_id: ret.JobID,
        institution_code: request.institution_id,
        status: ConnectionStatus.CREATED,
        provider: 'sophtron'
      }
    }
    return undefined
  }

  async DeleteConnection(id: string, userId: string): Promise<void> {
    return this.apiClient.deleteMember(userId, id)
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const job_type = mapJobType(JobTypes.AGGREGATE)

    const username = request.credentials.find(
      (item) => item.id === 'username'
    ).value
    const password = request.credentials.find(
      (item) => item.id === 'password'
    ).value
    const ret = await this.apiClient.updateMember(
      userId,
      request.id,
      job_type,
      username,
      password
    )
    return {
      id: ret.MemberID,
      cur_job_id: ret.JobID,
      institution_code: 'institution_code', // TODO
      provider: 'sophtron'
    }
  }

  async GetConnectionById(
    connectionId: string,
    userId: string
  ): Promise<Connection> {
    const m = await this.apiClient.getMember(userId, connectionId)
    return {
      id: m.MemberID,
      institution_code: m.InstitutionID,
      provider: 'sophtron',
      user_id: userId
    }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async GetConnectionStatus(
    memberId: string,
    jobId: string,
    single_account_select: boolean,
    userId: string
  ): Promise<Connection> {
    if (!jobId) {
      const ret = await this.GetConnectionById(memberId, userId)
      return ret
    }
    const job = await this.apiClient.getJobInfo(jobId)
    const challenge: Challenge = {
      id: '',
      type: ChallengeType.QUESTION
    }
    let status = ConnectionStatus.CHALLENGED
    let jobStatus = job.LastStatus
    if (job.SuccessFlag === true) {
      jobStatus = 'success'
    } else if (job.SuccessFlag === false) {
      jobStatus = 'failed'
    }
    switch (jobStatus) {
      case 'success':
        // case 'Completed':
        status = ConnectionStatus.CONNECTED
        break
      case 'failed':
        status = ConnectionStatus.FAILED
        break
      case 'AccountsReady': {
        const jobType = job.JobType.toLowerCase()
        if (
          single_account_select &&
          (!job.AccountID ||
            job.AccountID === '00000000-0000-0000-0000-000000000000') &&
          (jobType === 'authallaccounts' || jobType === 'refreshauthall')
        ) {
          const accounts =
            await this.apiClientV1.getUserInstitutionAccounts(memberId)
          challenge.id = 'single_account_select'
          challenge.external_id = 'single_account_select'
          challenge.type = ChallengeType.OPTIONS
          challenge.question = 'Please select an account to proceed:'
          challenge.data = accounts.map((a: any) => ({
            key: `${a.AccountName} ${a.AccountNumber}`,
            value: a.AccountID
          }))
        } else {
          status = ConnectionStatus.CREATED
        }
        break
      }
      default:
        if (job.SecurityQuestion) {
          challenge.id = 'SecurityQuestion'
          challenge.type = ChallengeType.QUESTION
          challenge.data = JSON.parse(job.SecurityQuestion).map(
            (q: string) => ({ key: q, value: q })
          )
        } else if (job.TokenMethod) {
          challenge.id = 'TokenMethod'
          challenge.type = ChallengeType.OPTIONS
          challenge.question =
            'Please select a channel to receive your secure code'
          challenge.data = JSON.parse(job.TokenMethod).map((q: string) => ({
            key: q,
            value: q
          }))
        } else if (job.TokenSentFlag === true) {
          challenge.id = 'TokenSentFlag'
          challenge.type = ChallengeType.QUESTION
          challenge.question = 'ota'
          challenge.data = [
            {
              key: 'ota',
              value: `Please enter the ${job.TokenInputName || 'OTA code'}`
            }
          ]
        } else if (job.TokenRead) {
          challenge.id = 'TokenRead'
          challenge.type = ChallengeType.TOKEN
          challenge.question = `Please approve from your secure device with the following token: ${job.TokenRead}`
          challenge.data = job.TokenRead
        } else if (job.CaptchaImage) {
          challenge.id = 'CaptchaImage'
          challenge.type = ChallengeType.IMAGE
          challenge.question = 'Please enter the Captcha code'
          challenge.data = job.CaptchaImage
          // TODO: select captcha, currently it's combined into one image and treated as a normal Captcha Image
          // challenge.type = ChallengeType.IMAGE_OPTION
          // challenge.label = ''
        } else {
          status = ConnectionStatus.CREATED
        }
        break
    }
    return {
      id: job.UserInstitutionID,
      user_id: userId,
      cur_job_id: job.JobID,
      status,
      challenges: challenge?.id ? [challenge] : undefined,
      provider: 'sophtron'
    }
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string
  ): Promise<boolean> {
    const c = request.challenges[0]
    let answer
    switch (c.id) {
      case 'TokenRead':
        answer = true
        break
      case 'SecurityQuestion':
        answer = JSON.stringify([c.response])
        break
      case 'TokenSentFlag':
      case 'single_account_select':
      case 'TokenMethod':
      case 'CaptchaImage':
        answer = c.response
        break
    }
    if (!answer) {
      error('Wrong challenge answer received', c)
      return false
    }
    await this.apiClient.answerJobMfa(jobId, c.id, answer)
    return true
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async ResolveUserId(user_id: string) {
    debug('Resolving UserId: ' + user_id)
    const sophtronUser = await this.apiClient.getCustomerByUniqueName(user_id)
    if (sophtronUser) {
      trace(`Found existing sophtron customer ${sophtronUser.CustomerID}`)
      return sophtronUser.CustomerID
    }
    trace(`Creating sophtron user ${user_id}`)
    const ret = await this.apiClient.createCustomer(user_id)
    if (ret) {
      return ret.CustomerID
    }
    trace(`Failed creating sophtron user, using user_id: ${user_id}`)
    return user_id
  }
}
