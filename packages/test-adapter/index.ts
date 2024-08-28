import { TestAdapter } from './adapter'
import { PROVIDER_STRING } from './constants'
import { getVC } from './vc'

export { TEST_EXAMPLE_LABEL_TEXT } from './constants'

export const adapterMapObject = {
  [PROVIDER_STRING]: {
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter()
  }
}

export { PROVIDER_STRING }
