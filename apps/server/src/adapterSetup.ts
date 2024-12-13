import type { AdapterMap } from "@repo/utils";
import { getTemplateAdapterMapObject } from "@ucp-npm/template-adapter";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";

const templateAdapterMapObject = getTemplateAdapterMapObject();

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...templateAdapterMapObject,
  ...testAdapterMapObject,
};
export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
