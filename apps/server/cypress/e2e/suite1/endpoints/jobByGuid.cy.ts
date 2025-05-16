import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";

describe("jobByGuid", () => {
  it("returns a job", () => {
    const testJobGuid = "junk";

    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: MX_AGGREGATOR_STRING,
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
