import { getAvailableAggregators } from "../shared/aggregators";
import { debug } from "../infra/logger";
import { getInstitution } from "../services/ElasticSearchClient";
import type {
  CachedInstitution,
  InstitutionAggregator,
  MappedJobTypes,
  Aggregator,
  ResolvedInstitution,
} from "../shared/contract";
import { getPreferences } from "../shared/preferences";
import { adapterMap } from "../adapterSetup";

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

export async function resolveInstitutionAggregator(
  institutionId: string,
  jobType: MappedJobTypes,
): Promise<ResolvedInstitution> {
  const institution = await getInstitution(institutionId);
  const preferences = await getPreferences();
  const aggregatorsWithAtLeastPartialSupport: Aggregator[] =
    getAvailableAggregators({
      institution,
      jobType,
      shouldRequireFullSupport: false,
      supportedAggregators: preferences.supportedAggregators,
    });

  const aggregatorsWithFullSupport: Aggregator[] = getAvailableAggregators({
    institution,
    jobType,
    shouldRequireFullSupport: true,
    supportedAggregators: preferences.supportedAggregators,
  });

  const aggregators = aggregatorsWithFullSupport.length
    ? aggregatorsWithFullSupport
    : aggregatorsWithAtLeastPartialSupport;

  let aggregator: Aggregator;

  const potentialResolvers = [
    () =>
      getAggregatorByVolume(
        preferences?.institutionAggregatorVolumeMap?.[institutionId],
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testAdapterName = (
    adapterMap[aggregator as keyof typeof adapterMap] as any
  )?.testInstitutionAdapterName;

  if (testAdapterName && institution.is_test_bank) {
    aggregator = testAdapterName;
  }

  debug(
    `Resolving institution: ${institutionId} to aggregator: ${aggregator} available aggregators: ${JSON.stringify(aggregators)}`,
  );

  return {
    id: institutionAggregator?.id,
    url: institution?.url,
    name: institution?.name,
    logo_url: institution?.logo,
    aggregator: aggregator as Aggregator,
  };
}
