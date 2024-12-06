import type { VCDataTypes, WidgetAdapter } from "@repo/utils";
import { info } from "./infra/logger";
import type { Aggregator } from "./adapterSetup";
import { adapterMap } from "./adapterSetup";

export function getAggregatorAdapter(aggregator: Aggregator): WidgetAdapter {
  const widgetAdapter = adapterMap[aggregator as keyof typeof adapterMap]?.widgetAdapter;

  if (widgetAdapter) {
    return widgetAdapter;
  }

  throw new Error(`Unsupported aggregator ${aggregator}`);
}

interface DataParameters {
  accountId?: string;
  connectionId?: string;
  endTime?: string;
  aggregator: Aggregator;
  startTime?: string;
  type: VCDataTypes;
  userId: string;
}

export async function getData({
  accountId,
  connectionId,
  endTime,
  aggregator,
  startTime,
  type,
  userId,
}: DataParameters) {
  const dataAdapter = adapterMap[aggregator as keyof typeof adapterMap]?.dataAdapter;

  if (dataAdapter) {
    info("Getting vc from aggregator", aggregator);

    return dataAdapter({
      accountId,
      connectionId,
      endTime,
      startTime,
      type,
      userId,
    });
  }

  throw new Error(`Unsupported aggregator ${aggregator}`);
}

export async function getVC({
  accountId,
  connectionId,
  endTime,
  aggregator,
  startTime,
  type,
  userId,
}: DataParameters) {
  const vcAdapter = adapterMap[aggregator as keyof typeof adapterMap]?.vcAdapter;

  if (vcAdapter) {
    info("Getting vc from aggregator", aggregator);

    return vcAdapter({
      accountId,
      connectionId,
      endTime,
      startTime,
      type,
      userId,
    });
  }

  throw new Error(`Unsupported aggregator ${aggregator}`);
}
