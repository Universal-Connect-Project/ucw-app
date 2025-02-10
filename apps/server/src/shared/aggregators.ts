import { JobTypeSupports } from "./contract";
import { ComboJobTypes, MappedJobTypes } from "@repo/utils";

import type {
  CachedInstitution,
  InstitutionAggregator,
  Aggregator,
} from "./contract";

const JobTypesPartialSupportsMap = {
  [ComboJobTypes.ACCOUNT_NUMBER]: JobTypeSupports.VERIFICATION,
  [ComboJobTypes.ACCOUNT_OWNER]: JobTypeSupports.IDENTIFICATION,
  [ComboJobTypes.TRANSACTIONS]: JobTypeSupports.AGGREGATE,
  [ComboJobTypes.TRANSACTION_HISTORY]: JobTypeSupports.AGGREGATE,
};

const JobTypesFullSupportsMap = {
  [ComboJobTypes.ACCOUNT_NUMBER]: JobTypeSupports.VERIFICATION,
  [ComboJobTypes.ACCOUNT_OWNER]: JobTypeSupports.IDENTIFICATION,
  [ComboJobTypes.TRANSACTIONS]: JobTypeSupports.AGGREGATE,
  [ComboJobTypes.TRANSACTION_HISTORY]: JobTypeSupports.FULLHISTORY,
};

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
  jobTypes,
  supportedAggregators,
  shouldRequireFullSupport,
}: {
  institution: CachedInstitution;
  jobTypes: ComboJobTypes[];
  supportedAggregators?: Aggregator[];
  shouldRequireFullSupport: boolean;
}): Aggregator[] {
  return supportedAggregators?.filter(
    (aggregator) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (institution as any)[aggregator]?.id != null &&
      aggregatorSupportsJobTypes({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        institutionAttributes: (institution as any)[aggregator],
        jobTypes,
        shouldRequireFullSupport,
      }),
  );
}

function aggregatorSupportsJobTypes({
  institutionAttributes,
  jobTypes,
  shouldRequireFullSupport,
}: {
  institutionAttributes: InstitutionAggregator | undefined;
  jobTypes: ComboJobTypes[];
  shouldRequireFullSupport: boolean;
}): boolean {
  const supportsMap = shouldRequireFullSupport
    ? JobTypesFullSupportsMap
    : JobTypesPartialSupportsMap;

  return !jobTypes.some(
    (comboJobType) => !institutionAttributes?.[supportsMap[comboJobType]],
  );
}
