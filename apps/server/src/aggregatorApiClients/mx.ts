import aggregatorCredentials from '../aggregatorCredentials'
import { Configuration, MxPlatformApiFactory } from 'mx-platform-node'

export const BASE_PATH = 'https://api.mx.com'.replace(/\/+$/, '')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
