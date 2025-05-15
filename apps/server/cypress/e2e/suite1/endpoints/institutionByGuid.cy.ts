import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { MX_BANK_UCP_INSTITUTION_ID } from "@repo/mx-adapter/src/testInstitutions";
import { ComboJobTypes } from "@repo/utils";

describe("institution by guid", () => {
  it("returns an institution when given an aggregator", () => {
    cy.request({
      headers: {
        meta: JSON.stringify({
          aggregator: MX_INT_AGGREGATOR_STRING,
        }),
      },
      url: `/institutions/${MX_BANK_UCP_INSTITUTION_ID}`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { body } = response;

      const expectedProperties = [
        "aggregator",
        "guid",
        "name",
        "url",
        "logo_url",
        "code",
      ];

      expectedProperties.forEach((property) => {
        expect(body[property]).to.exist;
      });
    });
  });

  it("returns an institution when not given an aggregator but given a UCP id and a job type", () => {
    cy.request({
      headers: {
        meta: JSON.stringify({
          jobTypes: [ComboJobTypes.TRANSACTIONS],
        }),
      },
      url: `/institutions/${MX_BANK_UCP_INSTITUTION_ID}`,
    }).then((response) => {
      expect(response.status).to.eq(200);

      const { body } = response;

      const expectedProperties = [
        "aggregator",
        "guid",
        "name",
        "url",
        "logo_url",
        "code",
      ];

      expectedProperties.forEach((property) => {
        expect(body[property]).to.exist;
      });
    });
  });
});
