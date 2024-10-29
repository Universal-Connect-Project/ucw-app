import { JobTypeSupports, MappedJobTypes } from "./contract";

import type {
  CachedInstitution,
  InstitutionAggregator,
  Aggregator,
} from "./contract";

type JobMappingType = {
  [key in MappedJobTypes]: JobTypeSupports[];
};

export const JOB_TYPE_PARTIAL_SUPPORT_MAP: JobMappingType = {
  [MappedJobTypes.AGGREGATE]: [JobTypeSupports.AGGREGATE],
  [MappedJobTypes.ALL]: [
    JobTypeSupports.AGGREGATE,
    JobTypeSupports.VERIFICATION,
    JobTypeSupports.IDENTIFICATION,
  ],
  [MappedJobTypes.FULLHISTORY]: [JobTypeSupports.AGGREGATE], // same filter as aggregate, because we fall back to aggregate if there is no fullhistory
  [MappedJobTypes.VERIFICATION]: [JobTypeSupports.VERIFICATION],
  [MappedJobTypes.IDENTITY]: [JobTypeSupports.IDENTIFICATION],
};

export const JOB_TYPE_FULL_SUPPORT_MAP: JobMappingType = {
  ...JOB_TYPE_PARTIAL_SUPPORT_MAP,
  [MappedJobTypes.FULLHISTORY]: [
    JobTypeSupports.AGGREGATE,
    JobTypeSupports.FULLHISTORY,
  ],
};

export function getAvailableAggregators({
  institution,
  jobType,
  supportedAggregators,
  shouldRequireFullSupport,
}: {
  institution: CachedInstitution;
  jobType: MappedJobTypes;
  supportedAggregators?: Aggregator[];
  shouldRequireFullSupport: boolean;
}): Aggregator[] {
  return supportedAggregators?.filter(
    (aggregator) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (institution as any)[aggregator]?.id != null &&
      aggregatorSupportsJobType({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        institutionAttributes: (institution as any)[aggregator],
        jobType,
        shouldRequireFullSupport,
      }),
  );
}

function aggregatorSupportsJobType({
  institutionAttributes,
  jobType,
  shouldRequireFullSupport,
}: {
  institutionAttributes: InstitutionAggregator | undefined;
  jobType: MappedJobTypes;
  shouldRequireFullSupport: boolean;
}): boolean {
  console.log(
    "shouldRequireFullSupport[jobType]",
    (shouldRequireFullSupport
      ? JOB_TYPE_FULL_SUPPORT_MAP
      : JOB_TYPE_PARTIAL_SUPPORT_MAP)[jobType],
  );
  return (
    shouldRequireFullSupport
      ? JOB_TYPE_FULL_SUPPORT_MAP
      : JOB_TYPE_PARTIAL_SUPPORT_MAP
  )[jobType].reduce((acc, supportsProp) => {
    console.log("supportsProp", supportsProp);
    console.log(
      "institutionAttributes",
      institutionAttributes?.[supportsProp as keyof InstitutionAggregator],
    );
    return (
      acc &&
      institutionAttributes?.[supportsProp as keyof InstitutionAggregator] ===
        true
    );
  }, true);
}
