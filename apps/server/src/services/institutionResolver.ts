import { debug } from '../infra/logger'
import { getInstitution, JOB_ES_MAPPING } from '../services/ElasticSearchClient'
import type {
  CachedInstitution,
  InstitutionProvider,
  JobType,
  Provider,
  ResolvedInstitution
} from '../shared/contract'
import { getPreferences } from '../shared/preferences'

const getProviderByVolume = (volumeMap: Record<string, number>): Provider => {
  if (!volumeMap) {
    return undefined
  }

  const randomNumber = Math.random() * 100
  let randomNumberCutoffTotal = 0

  return Object.entries(volumeMap).find(([, volume]) => {
    if (
      randomNumber > randomNumberCutoffTotal &&
      randomNumber <= randomNumberCutoffTotal + volume
    ) {
      return true
    }

    randomNumberCutoffTotal += volume

    return false
  })?.[0] as Provider
}

export async function resolveInstitutionProvider(
  institutionId: string,
  jobType: JobType
): Promise<ResolvedInstitution> {
  const institution = await getInstitution(institutionId)
  const preferences = await getPreferences()
  const providers: Provider[] = getAvailableProviders(
    institution,
    jobType,
    preferences.supportedProviders
  )

  let provider: Provider

  const potentialResolvers = [
    () =>
      getProviderByVolume(
        preferences?.institutionProviderVolumeMap?.[institutionId]
      ),
    () => getProviderByVolume(preferences?.defaultProviderVolume),
    () => preferences?.defaultProvider
  ]

  for (const resolver of potentialResolvers) {
    const possibleProvider = resolver()

    if (providers.includes(possibleProvider)) {
      provider = possibleProvider
      break
    }
  }

  if (!provider) {
    provider = providers[Math.floor(Math.random() * providers.length)]
  }

  const institutionProvider = institution[
    provider as keyof CachedInstitution
  ] as InstitutionProvider
  if (provider === 'mx') {
    if (institution.is_test_bank) {
      provider = 'mx_int'
    }
  }

  debug(
    `Resolving institution: ${institutionId} to provider: ${provider} available providers: ${JSON.stringify(providers)}`
  )

  return {
    id: institutionProvider?.id,
    url: institution?.url,
    name: institution?.name,
    logo_url: institution?.logo,
    provider: provider as Provider
  }
}

function getAvailableProviders(
  institution: CachedInstitution,
  jobType: JobType,
  supportedProviders?: Provider[]
): Provider[] {
  const providers = []
  if (
    supportedProviders.includes('mx') &&
    institution.mx.id != null &&
    providerSupportsJobType(institution.mx, jobType)
  ) {
    providers.push('mx')
  }
  if (
    supportedProviders.includes('sophtron') &&
    institution.sophtron.id != null &&
    providerSupportsJobType(institution.sophtron, jobType)
  ) {
    providers.push('sophtron')
  }

  return providers as Provider[]
}

function providerSupportsJobType(
  institutionAttributes: InstitutionProvider | undefined,
  jobType: JobType
): boolean {
  return JOB_ES_MAPPING[jobType].reduce((acc, supportsProp) => {
    return (
      acc &&
      institutionAttributes?.[supportsProp as keyof InstitutionProvider] ===
        true
    )
  }, true)
}
