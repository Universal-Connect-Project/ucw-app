import providerCredentials from '../providerCredentials'
import { Configuration, MxPlatformApiFactory } from './mxClient'

// The following lines fix a TypeError in the MxPlatformApiFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { AxiosPromise } from 'mx-platform-node/node_modules/axios'

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
