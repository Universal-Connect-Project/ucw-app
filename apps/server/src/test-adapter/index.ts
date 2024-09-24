import { TestAdapter } from './adapter'
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
  TEST_EXAMPLE_C_AGGREGATOR_STRING
} from './constants'
import { getVC } from './vc'

export const adapterMapObject = {
  [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
    testInstitutionAdapterName: TEST_EXAMPLE_C_AGGREGATOR_STRING,
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter({
      labelText: TEST_EXAMPLE_A_LABEL_TEXT,
      aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING
    })
  },
  [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter({
      labelText: TEST_EXAMPLE_B_LABEL_TEXT,
      aggregator: TEST_EXAMPLE_B_AGGREGATOR_STRING
    })
  },
  [TEST_EXAMPLE_C_AGGREGATOR_STRING]: {
    vcAdapter: getVC,
    widgetAdapter: new TestAdapter({
      labelText: TEST_EXAMPLE_C_LABEL_TEXT,
      aggregator: TEST_EXAMPLE_C_AGGREGATOR_STRING
    })
  }
}

export { TestAdapter }

export {
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  TEST_EXAMPLE_C_AGGREGATOR_STRING
}
