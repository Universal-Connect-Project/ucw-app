import { MEMBERS_URL } from "@repo/utils";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../../../../src/test-adapter/constants";

describe("get members", () => {
  it("returns the connections by the connectionId and aggregator", () => {
    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
          connectionId: "test",
        }),
      },
      url: MEMBERS_URL,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { body } = response;
      const [firstResult] = body;

      const expectedProperties = [
        "aggregator",
        "connection_status",
        "guid",
        "institution_guid",
        "is_oauth",
      ];

      expectedProperties.forEach((property) => {
        expect(firstResult[property]).to.exist;
      });
    });
  });
});
