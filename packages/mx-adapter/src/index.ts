// What do we need access to from ucw-app?

import { MxAdapter } from './adapter'
import { setConfig } from './config'
import getVC from './mxClient/vc'

// Everything in config.ts
// redisGet
// redisSet

export const providerName = 'mx'
export const integrationProviderName = 'mx_int'

export { getVC, MxAdapter, setConfig }
