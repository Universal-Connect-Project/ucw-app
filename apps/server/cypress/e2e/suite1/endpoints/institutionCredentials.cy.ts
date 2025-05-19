import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { getInstitution } from "../../../shared/utils/mx";

describe("institution credentials", () => {
  it("returns a set of credentials", () => {
    getInstitution().then((response) => {
      const institutionCode = response.body.code;

      cy.request({
        headers: {
          meta: JSON.stringify({
            aggregator: MX_INT_AGGREGATOR_STRING,
          }),
        },
        url: `/institutions/${institutionCode}/credentials`,
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
