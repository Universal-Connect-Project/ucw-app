import { TestAdapter } from 'packages/mx-adapter/src/adapter'
import {
  TEST_EXAMPLE_A_PROVIDER_STRING,
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_PROVIDER_STRING,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
  TEST_EXAMPLE_C_PROVIDER_STRING
} from 'packages/mx-adapter/src/constants'
import { getVC } from 'packages/mx-adapter/src/vc'

export const adapterMapObject = {
  [TEST_EXAMPLE_A_PROVIDER_STRING]: {
    testInstitutionAdapterName: TEST_EXAMPLE_C_PROVIDER_STRING,
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
  },
  [TEST_EXAMPLE_C_PROVIDER_STRING]: {
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter({
      labelText: TEST_EXAMPLE_C_LABEL_TEXT,
      provider: TEST_EXAMPLE_C_PROVIDER_STRING
    })
  }
}

export { TestAdapter }

export {
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
  TEST_EXAMPLE_A_PROVIDER_STRING,
  TEST_EXAMPLE_B_PROVIDER_STRING,
  TEST_EXAMPLE_C_PROVIDER_STRING
}
