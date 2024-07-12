import { createCipheriv, createDecipheriv } from 'crypto'
import { algo, enc } from 'crypto-js'
import config from '../config'
import { JobTypes, MappedJobTypes } from '../shared/contract'

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
