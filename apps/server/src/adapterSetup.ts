import type { AdapterMap } from "@repo/utils";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
