import type { VCDataTypes, WidgetAdapter } from '@repo/utils'
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
