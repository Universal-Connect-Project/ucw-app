import { INSTRUMENTATION_URL, JobTypes, MappedJobTypes } from "@repo/utils";

describe("instrumentation endpoint", () => {
  it("attaches some properties to the meta header", () => {
    const testUserId = "test";

    cy.request({
      method: "POST",
      url: `${INSTRUMENTATION_URL}/userId/${testUserId}/jobType/${JobTypes.AGGREGATE}`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { job_type, user_id } = JSON.parse(response.headers.meta as string);

      expect(job_type).to.eq(MappedJobTypes.AGGREGATE);
      expect(user_id).to.eq(testUserId);
    });
  });
});
