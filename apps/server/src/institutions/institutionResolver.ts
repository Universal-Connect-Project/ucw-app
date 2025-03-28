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

  let aggregator: Aggregator;
  let institutionAggregator;

  if (aggregatorOverride) {
    aggregator = aggregatorOverride;

    if (institution.is_test_bank) {
      institutionAggregator =
        institution[getAggregatorIdFromTestAggregatorId(aggregatorOverride)];
    } else {
      institutionAggregator = institution[aggregator];
    }

    debug(
      `Resolving institution: ${ucpInstitutionId} to aggregator: ${aggregator} because it's a refresh`,
    );
  } else {
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

    institutionAggregator = institution[
      aggregator as keyof CachedInstitution
    ] as InstitutionAggregator;

    const testAdapterName =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (adapterMap[aggregator as keyof typeof adapterMap] as any)?.testAdapterId;

    if (testAdapterName && institution.is_test_bank) {
      aggregator = testAdapterName;
    }

    debug(
      `Resolving institution: ${ucpInstitutionId} to aggregator: ${aggregator} available aggregators: ${JSON.stringify(aggregators)}`,
    );
  }

  return {
    id: institutionAggregator?.id,
    url: institution?.url,
    name: institution?.name,
    logo_url: institution?.logo,
    aggregator: aggregator as Aggregator,
  };
}
