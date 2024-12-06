import type { AdapterMap } from "@repo/utils";
import { getTemplateAdapterMapObject } from "@ucp-npm/template-adapter";
import { getFinicityAdapterMapObject } from "@ucp-npm/finicity-adapter";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";

const templateAdapterMapObject = getTemplateAdapterMapObject();
const finicityAdapterMapyObject = getFinicityAdapterMapObject();

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...finicityAdapterMapyObject,
  ...templateAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
