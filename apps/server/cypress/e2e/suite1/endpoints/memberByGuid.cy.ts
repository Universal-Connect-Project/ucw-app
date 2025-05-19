import {
  MX_AGGREGATOR_STRING,
  MX_INT_AGGREGATOR_STRING,
} from "@repo/mx-adapter";
import { addMember } from "../../../shared/utils/mx";

describe("member by guid", () => {
  it("returns a member", () => {
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
        url: `/members/${connectionId}`,
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
});
