import { adapterMapObject as testAdapterMapObject } from './test-adapter'
import { MxAdapter } from './adapters/mx'
import { SophtronAdapter } from './adapters/sophtron'

import { mxIntGetVC, mxProdGetVC } from './services/vcProviders/mxVc'
import getSophtronVc from './services/vcProviders/sophtronVc'

const mxAdapterMapObject = {
  mx: {
    vcAdapter: mxProdGetVC,
    widgetAdapter: new MxAdapter(false)
  },
  mx_int: {
    vcAdapter: mxIntGetVC,
    widgetAdapter: new MxAdapter(true)
  }
}

const sophtronAdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter()
  }
}

// This is where you add adapters
export const adapterMap = {
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject
}

export type Provider = keyof typeof adapterMap
