import { JOB_ES_MAPPING } from '../services/ElasticSearchClient'
import {
  CachedInstitution,
  InstitutionProvider,
  MappedJobTypes,
  Provider,
  Providers
} from './contract'

export function getAvailableProviders(
  institution: CachedInstitution,
  jobType: MappedJobTypes,
  supportedProviders?: Provider[]
): Provider[] {
  const providers = []
  if (
    supportedProviders.includes(Providers.MX) &&
    institution.mx?.id != null &&
    providerSupportsJobType(institution.mx, jobType)
  ) {
    providers.push(Providers.MX)
  }
  if (
    supportedProviders.includes(Providers.SOPHTRON) &&
    institution.sophtron?.id != null &&
    providerSupportsJobType(institution.sophtron, jobType)
  ) {
    providers.push(Providers.SOPHTRON)
  }

  return providers as Provider[]
}

function providerSupportsJobType(
  institutionAttributes: InstitutionProvider | undefined,
  jobType: MappedJobTypes
): boolean {
  return JOB_ES_MAPPING[jobType].reduce((acc, supportsProp) => {
    return (
      acc &&
      institutionAttributes?.[supportsProp as keyof InstitutionProvider] ===
        true
    )
  }, true)
}
