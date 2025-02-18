import { ComboJobTypes, MEMBERS_URL } from "@repo/utils";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../../../../src/test-adapter/constants";

describe("addMember", () => {
  it("responds with a member", () => {
    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
          jobTypes: [ComboJobTypes.TRANSACTIONS],
        }),
      },
      method: "POST",
      url: MEMBERS_URL,
    }).then(
      (
        response: Cypress.Response<{
          member: {
            institution_guid: string;
          };
        }>,
      ) => {
        expect(response.status).to.eq(200);
        const { body } = response;

        const { member } = body;

        expect(member).to.exist;

        expect(member.institution_guid).to.exist;
      },
    );
  });
});
