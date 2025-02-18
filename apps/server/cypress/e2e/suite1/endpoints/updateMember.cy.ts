import { ComboJobTypes, MEMBERS_URL } from "@repo/utils";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../../../../src/test-adapter/constants";

describe("updates a member", () => {
  it("responds with a member", () => {
    cy.request({
      body: {
        institution_guid: "institutionCode",
        guid: "testConnectionId",
        connection_status: 3,
        most_recent_job_guid: null,
        is_oauth: false,
        aggregator: "testExampleC",
        is_being_aggregated: false,
        user_guid: "e07115cc-bbf9-466a-b7db-cdbc9c7cd31b",
        mfa: {
          credentials: [
            {
              guid: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
              credential_guid: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
              label: "Please select an account:",
              type: 2,
              options: [
                {
                  guid: "Checking",
                  label: "Checking",
                  value: "act-23445745",
                  credential_guid: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
                },
                {
                  guid: "Savings",
                  label: "Savings",
                  value: "act-352386787",
                  credential_guid: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
                },
              ],
            },
          ],
        },
        credentials: [
          {
            guid: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
            value: "Checking",
          },
        ],
      },
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
