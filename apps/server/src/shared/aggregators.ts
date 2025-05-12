import { JobTypeSupports } from "./contract";
import { type CachedInstitution, ComboJobTypes } from "@repo/utils";

import type { InstitutionAggregator, Aggregator } from "./contract";

export const JobTypesPartialSupportsMap = {
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
