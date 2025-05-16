import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { MEMBERS_URL } from "@repo/utils";
import { addMember } from "../../../shared/utils/mx";

describe("get members", () => {
  it("returns the connections by the connectionId and aggregator", () => {
    addMember().then(
      (
        response: Cypress.Response<{
          member: {
            guid: string;
          };
        }>,
      ) => {
        const connectionId = response.body.member.guid;

        const resolvedUserId = JSON.parse(
          response.headers.meta as string,
        ).resolvedUserId;

        cy.request({
          headers: {
            meta: JSON.stringify({
              aggregator: MX_INT_AGGREGATOR_STRING,
              connectionId,
              resolvedUserId,
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
      },
    );
  });
});
