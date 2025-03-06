import { ComboJobTypes, INSTRUMENTATION_URL } from "@repo/utils";

describe("instrumentation endpoint", () => {
  it("attaches some properties to the meta header", () => {
    const testUserId = "test";

    cy.request({
      body: {
        jobTypes: [
          ComboJobTypes.TRANSACTIONS,
          ComboJobTypes.TRANSACTION_HISTORY,
        ],
      },
      method: "POST",
      url: `${INSTRUMENTATION_URL}/userId/${testUserId}?jobTypes=`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { jobTypes, userId } = JSON.parse(response.headers.meta as string);

      expect(jobTypes).to.deep.eq([
        ComboJobTypes.TRANSACTIONS,
        ComboJobTypes.TRANSACTION_HISTORY,
      ]);
      expect(userId).to.eq(testUserId);
    });
  });
});
