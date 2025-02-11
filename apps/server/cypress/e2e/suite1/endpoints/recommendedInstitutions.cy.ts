import { ComboJobTypes, RECOMMENDED_INSTITUTIONS_URL } from "@repo/utils";

describe("recommended institutions endpoint", () => {
  it("returns a list of recommended institutions", () => {
    cy.request({
      headers: {
        meta: JSON.stringify({
          jobTypes: [ComboJobTypes.TRANSACTIONS],
        }),
      },
      url: RECOMMENDED_INSTITUTIONS_URL,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.length).to.be.greaterThan(0);

      const [firstResult] = response.body;

      expect(firstResult.guid).to.exist;
      expect(firstResult.logo_url).to.exist;
      expect(firstResult.name).to.exist;
      expect(firstResult.url).to.exist;
    });
  });
});
