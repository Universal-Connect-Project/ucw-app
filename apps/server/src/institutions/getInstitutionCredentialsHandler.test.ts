import { ComboJobTypes } from "@repo/utils";
import {
  getInstitutionCredentialsHandler,
  type GetInstitutionCredentialsRequest,
} from "./getInstitutionCredentialsHandler";
import type { Response } from "express";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { institutionCredentialsData as mxInstitutionCredentialsData } from "@repo/utils-dev-dependency";

describe("getInstitutionCredentialsHandler", () => {
  it("returns with the institution credentials", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      aggregator: MX_AGGREGATOR_STRING,
    };

    const req = {
      context,
      params: {
        institution_guid: "test",
      },
    } as unknown as GetInstitutionCredentialsRequest;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    const institutionCredentials = mxInstitutionCredentialsData.credentials;

    await getInstitutionCredentialsHandler(req, res);

    expect(res.send).toHaveBeenCalledWith([
      {
        field_name: institutionCredentials[0].field_name,
        field_type: 1,
        guid: institutionCredentials[0].guid,
        id: institutionCredentials[0].guid,
        label: institutionCredentials[0].label,
      },
      {
        field_name: institutionCredentials[1].field_name,
        field_type: 3,
        guid: institutionCredentials[1].guid,
        id: institutionCredentials[1].guid,
        label: institutionCredentials[1].label,
      },
    ]);
  });
});
