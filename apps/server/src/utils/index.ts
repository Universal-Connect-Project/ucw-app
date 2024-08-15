import { createCipheriv, createDecipheriv } from 'crypto'
import { algo, enc } from 'crypto-js'
import { AkoyaAdapter } from '../adapters/akoya'
import { FinicityAdapter } from '../adapters/finicity'
import { MxAdapter } from '../adapters/mx'
import { SophtronAdapter } from '../adapters/sophtron'
import config from '../config'
import type {
  CachedInstitution,
  Connection,
  Institution,
  InstitutionSearchResponseItem,
  WidgetAdapter
} from '../shared/contract'

import type { Member } from 'interfaces/contract'
import {
  ChallengeType,
  ConnectionStatus,
  JobTypes,
  MappedJobTypes
} from '../shared/contract'

export function hmac(text: string, key: string) {
  const hmac = algo.HMAC.create(algo.SHA256, enc.Base64.parse(key))
  hmac.update(text)
  return enc.Base64.stringify(hmac.finalize())
}

export function buildSophtronAuthCode(
  httpMethod: string,
  url: string,
  apiUserID: string,
  secret: string
) {
  const authPath = url.substring(url.lastIndexOf('/')).toLowerCase()
  const text = httpMethod.toUpperCase() + '\n' + authPath
  const b64Sig = hmac(text, secret)
  const authString = 'FIApiAUTH:' + apiUserID + ':' + b64Sig + ':' + authPath
  return authString
}

const algorithm = config.CryptoAlgorithm

export function encrypt(text: string, keyHex: string, ivHex: string) {
  if (text == null || text === '') {
    return ''
  }
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const cipher = createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return encrypted.toString('hex')
}

export function decrypt(text: string, keyHex: string, ivHex: string) {
  if (text == null || text === '') {
    return ''
  }
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = Buffer.from(text, 'hex')
  const decipher = createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export function decodeAuthToken(input: string) {
  try {
    const str = Buffer.from(input, 'base64').toString('utf-8')
    const arr = str.split(';')
    if (arr.length !== 3) {
      return input
    }
    return {
      provider: arr[0],
      token: arr[1],
      iv: arr[2]
    }
  } catch (err) {
    return input
  }
}

export function mapJobType(input: JobTypes) {
  const inputLowerCase = input.toLowerCase()
  switch (inputLowerCase) {
    case JobTypes.AGGREGATE:
      return MappedJobTypes.AGGREGATE
    case JobTypes.ALL:
      return MappedJobTypes.ALL
    case JobTypes.FULLHISTORY:
      return MappedJobTypes.FULLHISTORY
    case JobTypes.VERIFICATION:
      return MappedJobTypes.VERIFICATION
    case JobTypes.IDENTITY:
      return MappedJobTypes.IDENTITY
    default:
      throw new Error('Invalid job type')
  }
}

export function mapResolvedInstitution(ins: Institution) {
  return {
    guid: ins.id,
    code: ins.id,
    name: ins.name,
    url: ins.url,
    logo_url: ins.logo_url,
    instructional_data: {},
    credentials: [] as any[],
    supports_oauth: ins.oauth ?? ins.name?.includes('Oauth'),
    providers: ins.providers,
    provider: ins.provider
  }
}

export function getProviderAdapter(provider: string): WidgetAdapter {
  switch (provider) {
    case 'mx':
      return new MxAdapter(false)
    case 'mx_int':
      return new MxAdapter(true)
    case 'sophtron':
      return new SophtronAdapter()
    case 'akoya':
      return new AkoyaAdapter(false)
    case 'akoya_sandbox':
      return new AkoyaAdapter(true)
    case 'finicity':
      return new FinicityAdapter()
    case 'finicity_sandbox':
      return new FinicityAdapter(true)
    default:
      throw new Error(`Unsupported provider ${provider}`)
  }
}

export function mapCachedInstitution(
  ins: CachedInstitution
): InstitutionSearchResponseItem {
  const supportsOauth = ins.mx.supports_oauth || ins.sophtron.supports_oauth
  // || ins.finicity.supports_oauth || ins.akoya.supports_oauth
  return {
    guid: ins.ucp_id,
    name: ins.name,
    url: ins.url,
    logo_url: ins.logo,
    supports_oauth: supportsOauth
  }
}

export function mapConnection(connection: Connection): Member {
  return {
    // ...connection,
    institution_guid: connection.institution_code,
    guid: connection.id,
    connection_status: connection.status ?? ConnectionStatus.CREATED, // ?
    most_recent_job_guid:
      connection.status === ConnectionStatus.CONNECTED
        ? null
        : connection.cur_job_id,
    is_oauth: connection.is_oauth,
    oauth_window_uri: connection.oauth_window_uri,
    provider: connection.provider,
    is_being_aggregated: connection.is_being_aggregated,
    user_guid: connection.user_id,
    mfa: {
      credentials: connection.challenges?.map((c) => {
        const ret = {
          guid: c.id,
          credential_guid: c.id,
          label: c.question,
          type: c.type,
          options: [] as any[]
        } as any
        switch (c.type) {
          case ChallengeType.QUESTION:
            ret.type = 0
            ret.label = (c.data as any[])?.[0].value || c.question
            break
          case ChallengeType.TOKEN:
            ret.type = 2 // ?
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            ret.label = `${c.question}: ${c.data}`
            break
          case ChallengeType.IMAGE:
            ret.type = 13
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ret.meta_data = (c.data as string).startsWith('data:image')
              ? c.data
              : 'data:image/png;base64, ' + c.data
            break
          case ChallengeType.OPTIONS:
            ret.type = 2
            ret.options = (c.data as any[]).map((d) => ({
              guid: d.key,
              label: d.key,
              value: d.value,
              credential_guid: c.id
            }))
            break
          case ChallengeType.IMAGE_OPTIONS:
            ret.type = 14
            ret.options = (c.data as any[]).map((d) => ({
              guid: d.key,
              label: d.key,
              data_uri: d.value,
              credential_guid: c.id
            }))
            break
        }
        return ret
      })
    }
  } as any
}
