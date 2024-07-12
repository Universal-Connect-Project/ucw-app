import { JOB_ES_MAPPING } from '../services/ElasticSearchClient'
import {
  CachedInstitution,
  InstitutionProvider,
  MappedJobTypes,
  Provider
} from './contract'

export function getAvailableProviders(
  institution: CachedInstitution,
  jobType: MappedJobTypes,
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
