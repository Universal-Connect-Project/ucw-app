import { getConfig } from './config'

export const getProviderCredentials = () => {
  const { MxApiSecret, MxApiSecretProd, MxClientId, MxClientIdProd } =
    getConfig()
  return {
    mxInt: {
      username: MxClientId,
      password: MxApiSecret,
      basePath: 'https://int-api.mx.com',
      vcEndpoint: 'https://int-api.mx.com/',
      provider: 'mx_int',
      available: true
    },
    mxProd: {
      username: MxClientIdProd,
      password: MxApiSecretProd,
      basePath: 'https://api.mx.com',
      vcEndpoint: 'https://api.mx.com/',
      provider: 'mx',
      available: true
    }
  }
}
