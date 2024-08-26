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
  const providers = supportedProviders?.filter(
    (provider) =>
      (institution as any)[provider]?.id != null &&
      providerSupportsJobType((institution as any)[provider], jobType)
  )

  return providers
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
