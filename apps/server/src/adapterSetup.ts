import {
  Adapter as TestAdapter,
  PROVIDER_STRING as TEST_ADAPTER_STRING
} from '@repo/test-adapter'
import { MxAdapter } from './adapters/mx'
import { SophtronAdapter } from './adapters/sophtron'
import type { WidgetAdapter } from '@repo/utils'

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
