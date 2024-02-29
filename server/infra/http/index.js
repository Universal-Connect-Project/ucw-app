import config from '../../config'
// import real from './real'
import * as real from './real'
import * as mocked from './mock'

const mock = config.Env === 'mocked'

export async function get (url, headers) {
  if (mock) {
    return await mocked.get(url)
  } else {
    return await real.get(url, headers)
  }
}

export async function wget (url) {
  if (mock) {
    return await mocked.wget(url)
  } else {
    return await real.wget(url)
  }
}

export async function post (url, data, headers) {
  if (mock) {
    return await mocked.post(url)
  } else {
    return await real.post(url, data, headers)
  }
}

export async function del (url, headers) {
  return await real.del(url, headers)
}

export async function put (url, data, headers) {
  return await real.put(url, data, headers)
}

export const stream = real.stream
