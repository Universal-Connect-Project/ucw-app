const processEnv = {}
const envs = { ...process.env, ...(process as Record<string, any>).client_envs }

Object.keys(envs).forEach((k) => {
  (processEnv as Record<string, any>)[k.toUpperCase()] = envs[k]
})

const nonSensitiveSharedConfig = {
  AuthServiceEndpoint: 'https://login.universalconnectproject.org/api',
  SearchEndpoint: 'https://search.universalconnectproject.org/api/',
  AnalyticsServiceEndpoint: 'https://analytics.universalconnectproject.org/api/',
  Component: 'UniversalWidget',
  ServiceName: 'universal_widget',
  CryptoAlgorithm: 'aes-256-cbc'
}

const keysToPullFromEnv = [
  "CryptoKey",
  "CryptoIv",

  "AuthProvider", 

  "LocalAuthEncryptionKey", 
  "LocalAuthPhrase",
  
  "SophtronClientId",
  "SophtronClientSecret",

  "UcpAuthClientId",
  "UcpAuthClientSecret",
  "UcpAuthEncryptionKey",

  "Demo",
  "DefaultProvider",
  "Port",

  "HostUrl",
  "WebhookHostUrl",
  "LogLevel",
  
  "Env",

  "RedisServer",
  "RedisCacheTimeSeconds",
  "ResourcePrefix",
  "ResourceVersion",
]

const config: Record<string, any> = keysToPullFromEnv.reduce((acc, envKey) => {
  return {
    ...acc,
    [envKey]: (processEnv as Record<string, any>)[envKey.toUpperCase()]
  }
}, {
  ...nonSensitiveSharedConfig
})

export default config
