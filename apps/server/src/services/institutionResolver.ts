import { debug } from '../infra/logger'
import { getInstitution } from '../services/ElasticSearchClient'
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
  if (institutionAttributes == null) {
    return false
  }
  switch (jobType) {
    case 'aggregate':
      return true
    case 'aggregate_extendedhistory':
      // The resolver doesn't check if extended history works
      // because that's how search works currently.
      // Even though we have the data to know if an institution
      // supports extended history we're not using it and the widget
      // will automatically fall back to the aggregate job if the
      // institution doesn't support extended history.

      // In the future maybe we could add some kind of check to see
      // if one of the available providers does support extended
      // history then resolve to that one, but if none support
      // it then any institution can run the aggregate job.
      return true
    case 'aggregate_identity':
      return !!institutionAttributes.supports_identification
    case 'verification':
      return !!institutionAttributes.supports_verification
    case 'aggregate_identity_verification':
      return (
        institutionAttributes.supports_identification &&
        institutionAttributes.supports_verification
      )
    default:
      return false
  }
}
