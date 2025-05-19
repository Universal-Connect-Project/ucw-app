import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { ComboJobTypes, MEMBERS_URL } from "@repo/utils";
import { addMember, getInstitution } from "../../../shared/utils/mx";

describe("updates a member", () => {
  it("responds with a member", () => {
    const userId = Cypress.env("userId");

    getInstitution().then((institutionResponse) => {
      const institutionCode = institutionResponse.body.code;

      addMember().then((memberResponse) => {
        const connectionId = memberResponse.body.member.guid;

        const resolvedUserId = JSON.parse(
          memberResponse.headers.meta as string,
        ).resolvedUserId;

        cy.request({
          body: {
            institution_guid: institutionCode,
            guid: connectionId,
            connection_status: 3,
            most_recent_job_guid: null,
            is_oauth: false,
            aggregator: MX_INT_AGGREGATOR_STRING,
            is_being_aggregated: false,
            user_guid: userId,
            credentials: [],
          },
          headers: {
            meta: JSON.stringify({
              aggregator: MX_INT_AGGREGATOR_STRING,
              jobTypes: [ComboJobTypes.TRANSACTIONS],
              resolvedUserId,
            }),
          },
          method: "PUT",
          url: `${MEMBERS_URL}/${userId}`,
        }).then(
          (
            response: Cypress.Response<{
              institution_guid: string;
            }>,
          ) => {
            expect(response.status).to.eq(200);
            const { body } = response;

            expect(body).to.exist;

            expect(body.institution_guid).to.exist;
          },
        );
      });
    });
  });
});
