import { WidgetJobTypes } from "@repo/utils";

export const TEST_EXAMPLE_A_AGGREGATOR_STRING = "testExampleA";
export const TEST_EXAMPLE_B_AGGREGATOR_STRING = "testExampleB";
export const TEST_EXAMPLE_C_AGGREGATOR_STRING = "testExampleC";

export const TEST_EXAMPLE_A_LABEL_TEXT = "TestExampleA Label";
export const TEST_EXAMPLE_B_LABEL_TEXT = "TestExampleB Label";
export const TEST_EXAMPLE_C_LABEL_TEXT = "TestExampleC Label";

export const testAggregatorMemberGuid = "testAggregatorMemberGuid";

export const testDataRequestValidatorStartTimeError =
  "&#x22;start_time&#x22; is required";
export const testDataRequestValidatorEndTimeError =
  "&#x22;end_time&#x22; is required";

export const testExampleInstitution = {
  logo_url:
    "https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
  name: "testInstitutionName",
  oauth: false,
  url: "testInstitutionUrl",
};

export const testExampleCredentials = {
  id: "testId",
  field_name: "fieldName",
  field_type: "fieldType",
};

export const testExampleJobResponse = {
  job: {
    guid: "testAggregatorMemberGuid",
    job_type: WidgetJobTypes.AGGREGATION,
  },
};
