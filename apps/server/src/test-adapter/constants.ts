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
  name: "test Bank (Oauth)",
  url: "www.test.com",
  logo_url: `http://localhost:8080/oauth/testExampleA/redirect_from/?code=examplecode&state=test_oauth_connection`,
  supports_oauth: true,
};

export const testExampleInstitution = {
  logo_url: "https://ucp-ui-f6cdc44acc3f.herokuapp.com/ucpLogo.png",
  name: "testInstitutionName",
  oauth: false,
  url: "testInstitutionUrl",
};

export const testExampleCredentials = {
  id: "testId",
  field_name: "fieldName",
  field_type: "fieldType",
};

export const testDataRequestValidators = {
  transactions: (req: any) => {
    if (!req.query.start_time) {
      return testDataRequestValidatorStartTimeError;
    }
    return undefined;
  },
};
