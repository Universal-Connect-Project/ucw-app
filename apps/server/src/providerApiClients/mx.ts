import providerCredentials from '../providerCredentials'
import { Configuration, MxPlatformApiFactory, mxPlatFormSDK } from './mxClient'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AxiosPromise } from 'mx-platform-node/node_modules/axios'

export * from './mxClient/api'
export * from './mxClient/configuration'
// export * from 'mx-platform-node/api'
// export * from 'mx-platform-node/configuration'

export const BASE_PATH = 'https://api.mx.com'.replace(/\/+$/, '')

export const MxProdApiClient = MxPlatformApiFactory(
  new Configuration({
    ...providerCredentials.mxProd,
    baseOptions: {
      headers: {
        Accept: 'application/vnd.mx.api.v2beta+json'
      }
    }
  })
)

export const MxIntApiClient = MxPlatformApiFactory(
  new Configuration({
    ...providerCredentials.mxInt,
    baseOptions: {
      headers: {
        Accept: 'application/vnd.mx.api.v2beta+json'
      }
    }
  })
)

export const MxIntApiClientSDK = mxPlatFormSDK.MxPlatformApiFactory(
  new Configuration({
    ...providerCredentials.mxInt,
    baseOptions: {
      headers: {
        Accept: 'application/vnd.mx.api.v2beta+json'
      }
    }
  })
)
