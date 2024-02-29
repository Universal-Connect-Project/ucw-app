import axios, { get as _get, delete as _delete, put as _put, post as _post } from 'axios'
import { error as _error, debug } from '../logger'

export async function stream (url, data, target) {
  // logger.debug(`stream request: ${url}`);
  return await axios({
    method: data != null ? 'post' : 'get',
    data,
    url,
    responseType: 'stream'
  })
    .then((res) => {
      // logger.debug(`Received stream response from ${url}`);
      return res
    })
    .catch((error) => {
      if (error.response != null) {
        _error(`error from ${url}`, error.response.status)
        return error.response
      }
      _error(`error from ${url}`, error)

      return undefined
    })
    .then((res) => {
      if (res?.headers != null) {
        if (res.headers['content-type'] != null) {
          target.setHeader('content-type', res.headers['content-type'])
        }
        return res.data.pipe(target)
      }
      target.status(500).send('unexpected error')

      return undefined
    })
}

export function handleResponse (promise, url, method, returnFullResObject) {
  return promise.then((res) => {
    debug(`Received ${method} response from ${url}`)
    return returnFullResObject === true ? res : res.data
  }).catch((error) => {
    _error(`error ${method} from ${url}`, error)
    throw error
  })
}

export async function wget (url) {
  console.log('wget from real')
  debug(`wget request: ${url}`)
  try {
    const response = await _get(url)
    return response.data
  } catch (error) {
    _error(`error ${method} from ${url}`, error)
    throw error
  }
}

export async function get (url, headers) {
  debug(`get request: ${url}`)
  try {
    const response = await _get(url, { headers })
    return response.data
  } catch (error) {
    _error(`error ${method} from ${url}`, error)
    throw error
  }
}

export async function del (url, headers, returnFullResObject) {
  try {
    const response = await _delete(url, { headers })
    return response.data
  } catch (error) {
    _error(`error ${method} from ${url}`, error)
    throw error
  }
}

export async function put (url, data, headers, returnFullResObject) {
  try {
    const response = await _put(url, data, { headers })
    return response.data
  } catch (error) {
    _error(`error ${method} from ${url}`, error)
    throw error
  }
}

export async function post (url, data, headers, returnFullResObject) {
  try {
    const response = await _post(url, data, { headers })
    return response.data
  } catch (error) {
    _error(`error ${method} from ${url}`, error)
    throw error
  }
}
