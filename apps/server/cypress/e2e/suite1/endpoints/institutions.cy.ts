import { ComboJobTypes, SEARCH_INSTITUTIONS_URL } from "@repo/utils";

describe("institutions endpoint", () => {
  it("returns a list of paginated institutions and paginates", () => {
    const requestOptions = {
      headers: {
        meta: JSON.stringify({
          jobTypes: [ComboJobTypes.TRANSACTIONS],
        }),
      },
      qs: {
        pageSize: 5,
        page: 1,
        search: "test",
      },
      url: SEARCH_INSTITUTIONS_URL,
    };

    cy.request(requestOptions).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.length).to.be.greaterThan(0);

      const [originalFirstResult] = response.body;

      cy.request({
        ...requestOptions,
        qs: {
          ...requestOptions.qs,
          page: 2,
        },
      }).then((secondRespose) => {
        const [firstResult] = secondRespose.body;

        expect(originalFirstResult.guid).not.to.eq(firstResult.guid);
      });
    });
  });
});
