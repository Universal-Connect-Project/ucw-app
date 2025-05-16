import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { addMember } from "../../../shared/utils/mx";

describe("member credentials", () => {
  it("returns a set of credentials", () => {
    addMember().then((response) => {
      const connectionId = response.body.member.guid;

      const resolvedUserId = JSON.parse(
        response.headers.meta as string,
      ).resolvedUserId;

      cy.request({
        headers: {
          meta: JSON.stringify({
            aggregator: MX_INT_AGGREGATOR_STRING,
            resolvedUserId,
          }),
        },
        url: `/members/${connectionId}/credentials`,
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
});
