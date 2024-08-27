import {
  Adapter as TestAdapter,
  PROVIDER_STRING as TEST_ADAPTER_STRING,
  getVC as getTestAdapterVC
} from '@repo/test-adapter'
import { MxAdapter } from './adapters/mx'
import { SophtronAdapter } from './adapters/sophtron'
import type { VCDataTypes, WidgetAdapter } from '@repo/utils'
import { get } from './services/storageClient/redis'
import { info } from './infra/logger'
import { mxIntGetVC, mxProdGetVC } from './services/vcProviders/mxVc'
import getSophtronVc from './services/vcProviders/sophtronVc'

export function getProviderAdapter(provider: string): WidgetAdapter {
  const adapterMap = {
    [TEST_ADAPTER_STRING]: new TestAdapter(),
    mx: new MxAdapter(false),
    mx_int: new MxAdapter(true),
    sophtron: new SophtronAdapter()
  }

  const widgetAdapter = (adapterMap as any)[provider]

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
  const mxHandleOauthResponse = async () =>
    await MxAdapter.HandleOauthResponse({
      ...rawQueries,
      ...rawParams,
      ...body
    })

  const adapterMap = {
    mx: mxHandleOauthResponse,
    mx_int: mxHandleOauthResponse
  }

  let res = {} as any
  const oauthHandler = (adapterMap as any)[provider]

  if (oauthHandler) {
    res = await oauthHandler()
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
  const adapterMap = {
    [TEST_ADAPTER_STRING]: getTestAdapterVC,
    mx: mxProdGetVC,
    mx_int: mxIntGetVC,
    sophtron: getSophtronVc
  }

  const vcAdapter = (adapterMap as any)[provider]

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
