import { ComboJobTypes, MEMBERS_URL } from "@repo/utils";
import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";

describe("addMember", () => {
  it("responds with a member", () => {
    const userId = Cypress.env("userId");

    cy.request({
      body: {
        institution_guid: "mxbank",
        credentials: [
          {
            guid: "CRD-9f61fb4c-912c-bd1e-b175-ccc7f0275cc1",
            value: "mxuser",
          },
          {
            guid: "CRD-e3d7ea81-aac7-05e9-fbdd-4b493c6e474d",
            value: "correct",
          },
        ],
      },
      headers: {
        meta: JSON.stringify({
          aggregator: MX_INT_AGGREGATOR_STRING,
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          userId,
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
