import { getAvailableAggregators } from "../shared/aggregators";
import { debug } from "../infra/logger";
import { getInstitution } from "../services/ElasticSearchClient";
import type { ComboJobTypes } from "@repo/utils";
import type {
  CachedInstitution,
  InstitutionAggregator,
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

export async function resolveInstitutionAggregator({
  ucpInstitutionId,
  jobTypes,
}: {
  ucpInstitutionId: string;
  jobTypes: ComboJobTypes[];
}): Promise<ResolvedInstitution> {
  const institution = await getInstitution(ucpInstitutionId);
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

  let aggregator: Aggregator;

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

  const testAdapterName =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adapterMap[aggregator as keyof typeof adapterMap] as any)
      ?.testInstitutionAdapterName;

  if (testAdapterName && institution.is_test_bank) {
    aggregator = testAdapterName;
  }

  debug(
    `Resolving institution: ${ucpInstitutionId} to aggregator: ${aggregator} available aggregators: ${JSON.stringify(aggregators)}`,
  );

  return {
    id: institutionAggregator?.id,
    url: institution?.url,
    name: institution?.name,
    logo_url: institution?.logo,
    aggregator: aggregator as Aggregator,
  };
}
