import * as real from './real'

export async function get (url, headers) {
  return await real.get(url, headers)
}

export async function wget (url) {
  return await real.wget(url)
}

export async function post (url, data, headers) {
  return await real.post(url, data, headers)
}

export async function del (url, headers) {
  return await real.del(url, headers)
}

export async function put (url, data, headers) {
  return await real.put(url, data, headers)
}

export const stream = real.stream
