import { createCipheriv, createDecipheriv } from 'crypto'
import { algo, enc } from 'crypto-js'
import config from '../config'
import { error } from '../infra/logger'

export function hmac(text, key) {
  const hmac = algo.HMAC.create(algo.SHA256, enc.Base64.parse(key))
  hmac.update(text)
  return enc.Base64.stringify(hmac.finalize())
}

export function buildSophtronAuthCode(httpMethod, url, apiUserID, secret) {
  const authPath = url.substring(url.lastIndexOf('/')).toLowerCase()
  const text = httpMethod.toUpperCase() + '\n' + authPath
  const b64Sig = hmac(text, secret)
  const authString = 'FIApiAUTH:' + apiUserID + ':' + b64Sig + ':' + authPath
  return authString
}

const algorithm = config.CryptoAlgorithm

export function encrypt(text, keyHex, ivHex) {
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

export function decrypt(text, keyHex, ivHex) {
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

export function decodeAuthToken(input) {
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

export function mapJobType(input) {
  const inputLowerCase = input.toLowerCase()
  switch (inputLowerCase) {
    case 'agg':
    case 'aggregation':
    case 'aggregate':
    case 'add':
    case 'utils':
    case 'util':
    case 'demo':
    case 'vc_transactions':
    case 'vc_transaction':
      return 'aggregate'
    case 'all':
    case 'everything':
    case 'aggregate_all':
    case 'aggregate_everything':
    case 'agg_all':
    case 'agg_everything':
      return 'aggregate_identity_verification'
    case 'fullhistory':
    case 'aggregate_extendedhistory':
      return 'aggregate_extendedhistory'
    case 'auth':
    case 'bankauth':
    case 'verify':
    case 'verification':
    case 'vc_account':
    case 'vc_accounts':
      return 'verification'
    case 'identify':
    case 'identity':
    case 'id':
    case 'vc_identity':
      return 'aggregate_identity'
    default:
      error('Invalid Job Type')
      return 'aggregate'
  }
}
