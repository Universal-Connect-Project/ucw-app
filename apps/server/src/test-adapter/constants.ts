export const TEST_EXAMPLE_A_AGGREGATOR_STRING = "testExampleA";
export const TEST_EXAMPLE_B_AGGREGATOR_STRING = "testExampleB";
export const TEST_EXAMPLE_C_AGGREGATOR_STRING = "testExampleC";

export const TEST_EXAMPLE_A_LABEL_TEXT = "TestExampleA Label";
export const TEST_EXAMPLE_B_LABEL_TEXT = "TestExampleB Label";
export const TEST_EXAMPLE_C_LABEL_TEXT = "TestExampleC Label";

export const testAggregatorMemberGuid = "testAggregatorMemberGuid";

export const testDataRequestValidatorStartTimeError =
  '"start_time" is required';

export const testExampleOauthInstitution = {
  guid: "test bank_oauth",
  code: "test bank_oauth",
  supportsOauth: true,
};

export const testExampleInstitution = {
  logo_url: "https://ucp-ui-f6cdc44acc3f.herokuapp.com/ucpLogo.png",
  name: "testInstitutionName",
  url: "testInstitutionUrl",
};

export const testExampleCredentials = {
  id: "testId",
  field_name: "fieldName",
  field_type: "fieldType",
};

export const testDataRequestValidators = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions: (req: any) => {
    if (!req.query.start_time) {
      return testDataRequestValidatorStartTimeError;
    }
    return undefined;
  },
};
