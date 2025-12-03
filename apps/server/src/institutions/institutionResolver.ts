import { getAvailableAggregators } from "../shared/aggregators";
import { debug } from "../infra/logger";
import { getInstitution } from "../services/ElasticSearchClient";
import type { CachedInstitution, ComboJobTypes } from "@repo/utils";
import type {
  InstitutionAggregator,
  Aggregator,
  ResolvedInstitution,
} from "../shared/contract";
import { getPreferences } from "../shared/preferences";
import { adapterMap } from "../adapterSetup";
import { getAggregatorIdFromTestAggregatorId } from "../adapterIndex";

const getAggregatorByVolume = (
  volumeMap: Record<string, number>,
): Aggregator => {
  if (!volumeMap) {
    return undefined;
  }

  const randomNumber = Math.random() * 100;
  let randomNumberCutoffTotal = 0;

  return Object.entries(volumeMap).find(([, volume]) => {
    if (
      randomNumber > randomNumberCutoffTotal &&
      randomNumber <= randomNumberCutoffTotal + volume
    ) {
      return true;
    }

    randomNumberCutoffTotal += volume;

    return false;
  })?.[0] as Aggregator;
};

const getAggregatorName = ({
  aggregator,
  institution,
}: {
  aggregator: Aggregator;
  institution: CachedInstitution;
}) => {
  const testAdapterName =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapterMap[aggregator as keyof typeof adapterMap] as any)?.testAdapterId;

  if (testAdapterName && institution.is_test_bank) {
    return testAdapterName;
  }

  return aggregator;
};

const resolveAggregator = async ({
  institution,
  jobTypes,
  ucpInstitutionId,
}: {
  institution: CachedInstitution;
  jobTypes: ComboJobTypes[];
  ucpInstitutionId: string;
}) => {
  let aggregator: Aggregator;

  const preferences = await getPreferences();
  const aggregatorsWithAtLeastPartialSupport: Aggregator[] =
    getAvailableAggregators({
      institution,
      jobTypes,
      shouldRequireFullSupport: false,
      supportedAggregators: preferences.supportedAggregators,
    });

  const aggregatorsWithFullSupport: Aggregator[] = getAvailableAggregators({
    institution,
    jobTypes,
    shouldRequireFullSupport: true,
    supportedAggregators: preferences.supportedAggregators,
  });

  const aggregators = aggregatorsWithFullSupport.length
    ? aggregatorsWithFullSupport
    : aggregatorsWithAtLeastPartialSupport;

  const potentialResolvers = [
    () =>
      getAggregatorByVolume(
        preferences?.institutionAggregatorVolumeMap?.[ucpInstitutionId],
      ),
    () => getAggregatorByVolume(preferences?.defaultAggregatorVolume),
    () => preferences?.defaultAggregator,
  ];

  for (const resolver of potentialResolvers) {
    const possibleAggregator = resolver();

    if (aggregators.includes(possibleAggregator)) {
      aggregator = possibleAggregator;
      break;
    }
  }

  if (!aggregator) {
    aggregator = aggregators[Math.floor(Math.random() * aggregators.length)];
  }

  const institutionAggregator = institution[
    aggregator as keyof CachedInstitution
  ] as InstitutionAggregator;

  aggregator = getAggregatorName({
    aggregator,
    institution,
  });

  debug(
    `Resolving institution: ${ucpInstitutionId} to aggregator: ${aggregator} available aggregators: ${JSON.stringify(aggregators)}`,
  );

  return {
    aggregator,
    institutionAggregator,
  };
};

const resolveByAggregatorOverride = ({
  aggregatorOverride,
  institution,
  ucpInstitutionId,
}: {
  aggregatorOverride: Aggregator;
  institution: CachedInstitution;
  ucpInstitutionId: string;
}) => {
  const aggregator = getAggregatorName({
    aggregator: aggregatorOverride,
    institution,
  });

  let institutionAggregator;

  if (institution.is_test_bank) {
    institutionAggregator =
      institution[getAggregatorIdFromTestAggregatorId(aggregatorOverride)];
  } else {
    institutionAggregator = institution[aggregator];
  }

  debug(
    `Resolving institution: ${ucpInstitutionId} to aggregator: ${aggregator}`,
  );

  return {
    aggregator,
    institutionAggregator,
  };
};

export async function resolveInstitutionAggregator({
  aggregatorOverride,
  jobTypes,
  ucpInstitutionId,
}: {
  aggregatorOverride?: Aggregator;
  jobTypes: ComboJobTypes[];
  ucpInstitutionId: string;
}): Promise<ResolvedInstitution> {
  const institution = await getInstitution(ucpInstitutionId);

  const { aggregator, institutionAggregator } = aggregatorOverride
    ? resolveByAggregatorOverride({
        aggregatorOverride,
        institution,
        ucpInstitutionId,
      })
    : await resolveAggregator({
        institution,
        jobTypes,
        ucpInstitutionId,
      });

  return {
    aggregator: aggregator as Aggregator,
    id: institutionAggregator?.id,
    logo_url: institution?.logo,
    name: institution?.name,
    supportsOauth: institutionAggregator?.supports_oauth,
    url: institution?.url,
  };
}
