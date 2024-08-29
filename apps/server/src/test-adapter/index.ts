import { TestAdapter } from './adapter'
import {
  TEST_EXAMPLE_A_PROVIDER_STRING,
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_PROVIDER_STRING,
  TEST_EXAMPLE_B_LABEL_TEXT
} from './constants'
import { getVC } from './vc'

export const adapterMapObject = {
  [TEST_EXAMPLE_A_PROVIDER_STRING]: {
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter({
      labelText: TEST_EXAMPLE_A_LABEL_TEXT,
      provider: TEST_EXAMPLE_A_PROVIDER_STRING
    })
  },
  [TEST_EXAMPLE_B_PROVIDER_STRING]: {
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter({
      labelText: TEST_EXAMPLE_B_LABEL_TEXT,
      provider: TEST_EXAMPLE_B_PROVIDER_STRING
    })
  }
}

export { TestAdapter }

export {
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_A_PROVIDER_STRING,
  TEST_EXAMPLE_B_PROVIDER_STRING
}
