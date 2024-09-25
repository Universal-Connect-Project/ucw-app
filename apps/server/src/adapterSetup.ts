import { getMxAdapterMapObject } from "@ucp-npm/mx-adapter";

import aggregatorCredentials from "./aggregatorCredentials";
import { adapterMapObject as testAdapterMapObject } from './test-adapter'
import { SophtronAdapter } from './adapters/sophtron'
import * as logger from 'src/infra/logger'
import { get, set } from './services/storageClient/redis'
import getSophtronVc from './services/vcAggregators/sophtronVc'

// const mxAdapterMapObject = {
//   mx: {
//     testInstitutionAdapterName: 'mx_int',
//     vcAdapter: mxProdGetVC,
//     widgetAdapter: new MxAdapter(false)
//   },
//   mx_int: {
//     vcAdapter: mxIntGetVC,
//     widgetAdapter: new MxAdapter(true)
//   }
// }

const sophtronAdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter()
  }
}

// This is where you add adapters
export const adapterMap = {
  ...getMxAdapterMapObject({
    cacheClient: {
      set: set,
      get: get
    },
    logClient: logger,
    credentials: aggregatorCredentials
  }),
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject
}

export type Aggregator = keyof typeof adapterMap
export const aggregators = Object.keys(adapterMap)
