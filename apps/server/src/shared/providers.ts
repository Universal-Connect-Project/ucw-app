import {
  CachedInstitution,
  InstitutionProvider,
  JobTypeSupports,
  MappedJobTypes,
  Provider,
  Providers
} from './contract'

type JobMappingType = {
  [key in MappedJobTypes]: JobTypeSupports[]
}

export const JOB_TYPE_PARTIAL_SUPPORT_MAP: JobMappingType = {
  [MappedJobTypes.AGGREGATE]: [JobTypeSupports.AGGREGATE],
  [MappedJobTypes.ALL]: [
    JobTypeSupports.AGGREGATE,
    JobTypeSupports.VERIFICATION,
    JobTypeSupports.IDENTIFICATION
  ],
  [MappedJobTypes.FULLHISTORY]: [JobTypeSupports.AGGREGATE], // same filter as aggregate, because we fall back to aggregate if there is no fullhistory
  [MappedJobTypes.VERIFICATION]: [JobTypeSupports.VERIFICATION],
  [MappedJobTypes.IDENTITY]: [JobTypeSupports.IDENTIFICATION]
}

export const JOB_TYPE_FULL_SUPPORT_MAP: JobMappingType = {
  ...JOB_TYPE_PARTIAL_SUPPORT_MAP,
  [MappedJobTypes.FULLHISTORY]: [
    JobTypeSupports.AGGREGATE,
    JobTypeSupports.FULLHISTORY
  ]
}

export function getAvailableProviders({
  institution,
  jobType,
  supportedProviders,
  shouldRequireFullSupport
}: {
  institution: CachedInstitution
  jobType: MappedJobTypes
  supportedProviders?: Provider[]
  shouldRequireFullSupport: boolean
}): Provider[] {
  const providers = []
  if (
    supportedProviders.includes(Providers.MX) &&
    institution.mx?.id != null &&
    providerSupportsJobType({
      institutionAttributes: institution.mx,
      jobType,
      shouldRequireFullSupport
    })
  ) {
    providers.push(Providers.MX)
  }
  if (
    supportedProviders.includes(Providers.SOPHTRON) &&
    institution.sophtron?.id != null &&
    providerSupportsJobType({
      institutionAttributes: institution.sophtron,
      jobType,
      shouldRequireFullSupport
    })
  ) {
    providers.push(Providers.SOPHTRON)
  }

  return providers as Provider[]
}

function providerSupportsJobType({
  institutionAttributes,
  jobType,
  shouldRequireFullSupport
}: {
  institutionAttributes: InstitutionProvider | undefined
  jobType: MappedJobTypes
  shouldRequireFullSupport: boolean
}): boolean {
  return (
    shouldRequireFullSupport
      ? JOB_TYPE_FULL_SUPPORT_MAP
      : JOB_TYPE_PARTIAL_SUPPORT_MAP
  )[jobType].reduce((acc, supportsProp) => {
    return (
      acc &&
      institutionAttributes?.[supportsProp as keyof InstitutionProvider] ===
        true
    )
  }, true)
}
