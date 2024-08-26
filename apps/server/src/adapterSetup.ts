import {
  Adapter as TestAdapter,
  PROVIDER_STRING as TEST_ADAPTER_STRING
} from '@repo/test-adapter'
import { MxAdapter } from './adapters/mx'
import { SophtronAdapter } from './adapters/sophtron'
import type { WidgetAdapter } from '@repo/utils'
import { get } from './services/storageClient/redis'
import { info } from './infra/logger'
import getMXVc from './services/vcProviders/mxVc'
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

export default async function getVc(
  provider: string,
  connectionId: string,
  type: string,
  userId: string,
  accountId?: string,
  startTime?: string,
  endTime?: string
) {
  info('Getting vc from provider', provider)
  switch (provider) {
    case 'mx':
      return await getMXVc(true, connectionId, type, userId, accountId)
    case 'mx_int':
      return await getMXVc(false, connectionId, type, userId, accountId)
    case 'sophtron':
      return await getSophtronVc(
        connectionId,
        type,
        userId,
        accountId,
        startTime,
        endTime
      )
  }
}
