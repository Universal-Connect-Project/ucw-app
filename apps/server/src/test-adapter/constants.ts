import { AGGREGATION_JOB_TYPE } from "@repo/utils";

export const TEST_EXAMPLE_A_AGGREGATOR_STRING = "testExampleA";
export const TEST_EXAMPLE_B_AGGREGATOR_STRING = "testExampleB";
export const TEST_EXAMPLE_C_AGGREGATOR_STRING = "testExampleC";

export const TEST_EXAMPLE_A_LABEL_TEXT = "TestExampleA Label";
export const TEST_EXAMPLE_B_LABEL_TEXT = "TestExampleB Label";
export const TEST_EXAMPLE_C_LABEL_TEXT = "TestExampleC Label";

export const testAggregatorMemberGuid = "testAggregatorMemberGuid";

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
    guid: "testGuid1",
    job_type: AGGREGATION_JOB_TYPE,
  },
};
