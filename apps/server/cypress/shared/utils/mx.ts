import {
  MX_BANK_UCP_INSTITUTION_ID,
  MX_INT_AGGREGATOR_STRING,
} from "@repo/mx-adapter";
import { ComboJobTypes, MEMBERS_URL } from "@repo/utils";

export const addMember = () => {
  const userId = Cypress.env("userId");

  return cy.request({
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
  });
};

export const getInstitution = () => {
  return cy.request({
    headers: {
      meta: JSON.stringify({
        aggregator: MX_INT_AGGREGATOR_STRING,
      }),
    },
    url: `/institutions/${MX_BANK_UCP_INSTITUTION_ID}`,
  });
};
