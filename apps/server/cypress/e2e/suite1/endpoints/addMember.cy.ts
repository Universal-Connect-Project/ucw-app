import { addMember } from "../../../shared/utils/mx";

describe("addMember", () => {
  it("responds with a member", () => {
    addMember().then(
      (
        response: Cypress.Response<{
          member: {};
        }>,
      ) => {
        expect(response.status).to.eq(200);
        const { body } = response;

        const { member } = body;

        expect(member).to.exist;

        const expectedProperties = [
          "aggregator",
          "connection_status",
          "guid",
          "institution_guid",
          "is_oauth",
        ];

        expectedProperties.forEach((property) => {
          expect(member[property]).to.exist;
        });
      },
    );
  });
});
