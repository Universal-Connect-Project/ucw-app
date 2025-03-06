import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../../../../src/test-adapter/constants";

describe("member by guid", () => {
  it("returns a member", () => {
    const testConnectionId = "testExampleA";

    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        }),
      },
      url: `/members/${testConnectionId}`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { body } = response;

      const expectedProperties = [
        "aggregator",
        "connection_status",
        "guid",
        "institution_guid",
        "is_oauth",
      ];

      expectedProperties.forEach((property) => {
        expect(body[property]).to.exist;
      });
    });
  });
});
