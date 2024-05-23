const processEnv = {}
const envs = { ...process.env, ...(process as Record<string, any>).client_envs }

Object.keys(envs).forEach((k) => {
  ;(processEnv as Record<string, any>)[k.toUpperCase()] = envs[k]
})

const nonSensitiveSharedConfig = {
  AuthServiceEndpoint: 'https://login.universalconnectproject.org/api',
  SearchEndpoint: 'https://search.universalconnectproject.org/api/',
  AnalyticsServiceEndpoint:
    'https://analytics.universalconnectproject.org/api/',
  Component: 'UniversalWidget',
  ServiceName: 'universal_widget',
  CryptoAlgorithm: 'aes-256-cbc',
  SophtronApiServiceEndpoint: 'https://api.sophtron.com/api',
  SophtronVCServiceEndpoint: 'https://vc.sophtron.com/api/'
}

const keysToPullFromEnv = [
  'SophtronClientId',
  'SophtronClientSecret',

  'Demo',
  'DefaultProvider',
  'PORT',

  'HostUrl',
  'WebhookHostUrl',
  'LogLevel',

  'Env',

  'RedisServer',
  'RedisCacheTimeSeconds',
  'ResourcePrefix',
  'ResourceVersion',

  'SophtronApiUserId',
  'SophtronApiUserSecret',

  'MxClientId',
  'MxApiSecret',
  'MxClientIdProd',
  'MxApiSecretProd',

  'AkoyaClientId',
  'AkoyaApiSecret',
  'AkoyaClientIdProd',
  'AkoyaApiSecretProd',

  'FinicityPartnerId',
  'FinicityAppKey',
  'FinicitySecret',
  'FinicityPartnerIdProd',
  'FinicityAppKeyProd',
  'FinicitySecretProd',

  'ElasticSearchPassword'
]

const config: Record<string, any> = keysToPullFromEnv.reduce(
  (acc, envKey) => {
    return {
      ...acc,
      [envKey]: (processEnv as Record<string, any>)[envKey.toUpperCase()]
    }
  },
  {
    ...nonSensitiveSharedConfig
  }
)

export default config
