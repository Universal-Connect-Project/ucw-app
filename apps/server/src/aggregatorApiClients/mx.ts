import aggregatorCredentials from 'src/aggregatorCredentials'
import { Configuration, MxPlatformApiFactory } from 'mx-platform-node'

export const BASE_PATH = 'https://api.mx.com'.replace(/\/+$/, '')

export const MxProdApiClient: any = MxPlatformApiFactory(
  new Configuration({
    ...aggregatorCredentials.mxProd,
    baseOptions: {
      headers: {
        Accept: 'application/vnd.mx.api.v2beta+json'
      }
    }
  })
)

export const MxIntApiClient: any = MxPlatformApiFactory(
  new Configuration({
    ...aggregatorCredentials.mxInt,
    baseOptions: {
      headers: {
        Accept: 'application/vnd.mx.api.v2beta+json'
      }
    }
  })
)
