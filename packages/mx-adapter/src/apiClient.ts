import { Configuration, MxPlatformApiFactory } from './mxClient'
import providerCredentials from './providerCredentials'
export * from './mxApi'
export * from './mxApiConfiguration'

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
