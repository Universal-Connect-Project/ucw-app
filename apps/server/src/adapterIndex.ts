import type { VCDataTypes, WidgetAdapter } from '@repo/utils'
import { get } from './services/storageClient/redis'
import { info } from './infra/logger'
import type { Provider } from './adapterSetup'
import { adapterMap } from './adapterSetup'

export function getProviderAdapter(provider: Provider): WidgetAdapter {
  const widgetAdapter = adapterMap[provider]?.widgetAdapter

  if (widgetAdapter) {
    return widgetAdapter
  }

  throw new Error(`Unsupported provider ${provider}`)
}

export const handleOauthResponse = async (
  provider: Provider,
  rawParams: any,
  rawQueries: any,
  body: any
) => {
  let res = {} as any
  const oauthHandler = (adapterMap as any)[provider]?.oauthResponseHandler

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

export async function getVC({
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
  provider: Provider
  startTime?: string
  type: VCDataTypes
  userId: string
}) {
  const vcAdapter = adapterMap[provider]?.vcAdapter

  if (vcAdapter) {
    info('Getting vc from provider', provider)

    return await vcAdapter({
      accountId,
      connectionId,
      endTime,
      startTime,
      type,
      userId
    })
  }

  throw new Error(`Unsupported provider ${provider}`)
}
