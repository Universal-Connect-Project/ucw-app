export const HostUrl = 'http://localhost:8080'
export const MxClientIdProd = 'test'
export const MxApiSecretProd = 'test'
export const MxClientId = 'test'
export const MxApiSecret = 'test'

interface Config {
  HostUrl: string
  MxClientIdProd: string
  MxApiSecretProd: string
  MxClientId: string
  MxApiSecret: string
}

let config: Config

export const setConfig = (newConfig: Config) => {
  config = newConfig
}

export const getConfig = () => config
