import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../../../../src/test-adapter/constants";

describe("jobByGuid", () => {
  it("returns a job", () => {
    const testJobGuid = "testExampleA";

    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        }),
      },
      url: `/jobs/${testJobGuid}`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { body } = response;

      expect(body.job_type).to.exist;
      expect(body.guid).to.exist;
    });
  });
});
