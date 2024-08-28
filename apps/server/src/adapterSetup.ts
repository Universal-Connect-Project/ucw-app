import { adapterMapObject as testAdapterMapObject } from '@repo/test-adapter'
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  HandleOauthReponseRequest,
  handleOauthResponse as mxHandleOauthResponse,
  MxAdapter
} from './adapters/mx'
import { SophtronAdapter } from './adapters/sophtron'

import { mxIntGetVC, mxProdGetVC } from './services/vcProviders/mxVc'
import getSophtronVc from './services/vcProviders/sophtronVc'

const mxAdapterMapObject = {
  mx: {
    oauthResponseHandler: mxHandleOauthResponse,
    vcAdapter: mxProdGetVC,
    widgetAdapter: new MxAdapter(false)
  },
  mx_int: {
    oauthResponseHandler: mxHandleOauthResponse,
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
