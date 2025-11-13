import { ComboJobTypes, INSTRUMENTATION_URL } from "@repo/utils";
import { createWidgetUrl } from "@repo/utils-e2e/cypress";

describe("instrumentation endpoint", () => {
  it("attaches some properties to the meta header", () => {
    const testUserId = "test";

    createWidgetUrl({
      jobTypes: [ComboJobTypes.TRANSACTIONS, ComboJobTypes.TRANSACTION_HISTORY],
      userId: testUserId,
      targetOrigin: "http://localhost:8080",
    }).then((widgetUrl) => {
      const url = new URL(widgetUrl);
      const token = url.searchParams.get("token");

      cy.request({
        method: "POST",
        url: `${INSTRUMENTATION_URL}/${token}`,
      }).then((response) => {
        expect(response.status).to.eq(200);

        const { jobTypes, userId } = JSON.parse(
          response.headers.meta as string,
        );

        expect(jobTypes).to.deep.eq([
          ComboJobTypes.TRANSACTIONS,
          ComboJobTypes.TRANSACTION_HISTORY,
        ]);
        expect(userId).to.eq(testUserId);
      });
    });
  });
});
