import { adapterMapObject as testAdapterMapObject } from '@repo/test-adapter'
import {
  handleOauthResponse as mxHandleOauthResponse,
  MxAdapter
} from './adapters/mx'
import { SophtronAdapter } from './adapters/sophtron'
import type { AdapterMapObject, VCDataTypes, WidgetAdapter } from '@repo/utils'
import { get } from './services/storageClient/redis'
import { info } from './infra/logger'
import { mxIntGetVC, mxProdGetVC } from './services/vcProviders/mxVc'
import getSophtronVc from './services/vcProviders/sophtronVc'

const mxAdapterMapObject: AdapterMapObject = {
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

const sophtronAdapterMapObject: AdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter()
  }
}

// This is where you add adapters
const adapterMapObjects = [
  testAdapterMapObject,
  mxAdapterMapObject,
  sophtronAdapterMapObject
]

const adapterMap = adapterMapObjects.reduce(
  (acc, adapterMapObject) => ({
    ...acc,
    ...adapterMapObject
  }),
  {}
)

export function getProviderAdapter(provider: string): WidgetAdapter {
  const widgetAdapter = adapterMap[provider]?.widgetAdapter

  if (widgetAdapter) {
    return widgetAdapter
  }

  throw new Error(`Unsupported provider ${provider}`)
}

export const handleOauthResponse = async (
  provider: string,
  rawParams: any,
  rawQueries: any,
  body: any
) => {
  let res = {} as any
  const oauthHandler = adapterMap[provider]?.oauthResponseHandler

  if (oauthHandler) {
    res = await oauthHandler({
      ...rawQueries,
      ...rawParams,
      ...body
    })
  }

  const ret = {
    ...res,
    provider
  }
  if (res?.id != null) {
    const context = await get(`context_${ret.request_id ?? ret.id}`)
    ret.scheme = context.scheme
    ret.oauth_referral_source = context.oauth_referral_source
  }
  return ret
}

export default async function getVc({
  accountId,
  connectionId,
  endTime,
  provider,
  startTime,
  type,
  userId
}: {
  accountId?: string
  connectionId?: string
  endTime?: string
  provider: string
  startTime?: string
  type: VCDataTypes
  userId: string
}) {
  const vcAdapter = adapterMap[provider]?.vcAdapter

  if (vcAdapter) {
    info('Getting vc from provider', provider)

    return vcAdapter({
      accountId,
      connectionId,
      endTime,
      provider,
      startTime,
      type,
      userId
    })
  }

  throw new Error(`Unsupported provider ${provider}`)
}
