import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../../../../src/test-adapter/constants";

describe("member credentials", () => {
  it("returns a set of credentials", () => {
    const testConnectionId = "testExampleA";

    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        }),
      },
      url: `/members/${testConnectionId}/credentials`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { body } = response;

      expect(body.length).to.be.greaterThan(0);

      const [firstResult] = body;

      const expectedProperties = [
        "id",
        "label",
        "guid",
        "field_name",
        "field_type",
      ];

      expectedProperties.forEach((property) => {
        expect(firstResult[property]).to.exist;
      });
    });
  });
});
