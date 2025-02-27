import { TestAdapter } from "./adapter";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
  TEST_EXAMPLE_C_AGGREGATOR_STRING,
  testAggregatorMemberGuid,
  testExampleInstitution,
  testDataRequestValidators,
} from "./constants";
import { dataAdapter } from "./dataAdapter";
import { getVC } from "./vc";

export const adapterMapObject = {
  [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
    testInstitutionAdapterName: TEST_EXAMPLE_C_AGGREGATOR_STRING,
    dataAdapter,
    vcAdapter: getVC,
    createWidgetAdapter: () =>
      new TestAdapter({
        labelText: TEST_EXAMPLE_A_LABEL_TEXT,
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      }),
  },
  [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
    dataAdapter,
    vcAdapter: getVC,
    createWidgetAdapter: () =>
      new TestAdapter({
        labelText: TEST_EXAMPLE_B_LABEL_TEXT,
        aggregator: TEST_EXAMPLE_B_AGGREGATOR_STRING,
        dataRequestValidators: testDataRequestValidators,
      }),
  },
  [TEST_EXAMPLE_C_AGGREGATOR_STRING]: {
    dataAdapter,
    vcAdapter: getVC,
    createWidgetAdapter: () =>
      new TestAdapter({
        labelText: TEST_EXAMPLE_C_LABEL_TEXT,
        aggregator: TEST_EXAMPLE_C_AGGREGATOR_STRING,
      }),
  },
};

export { TestAdapter };

export {
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_LABEL_TEXT,
  TEST_EXAMPLE_C_LABEL_TEXT,
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  TEST_EXAMPLE_C_AGGREGATOR_STRING,
  testAggregatorMemberGuid,
  testExampleInstitution,
};
