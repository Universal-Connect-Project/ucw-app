import { ComboJobTypes } from "@repo/utils";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import {
  getInstitutionCredentialsHandler,
  type GetInstitutionCredentialsRequest,
} from "./getInstitutionCredentialsHandler";
import type { Response } from "express";
import {
  TEST_EXAMPLE_A_LABEL_TEXT,
  testExampleCredentials,
} from "../test-adapter/constants";

describe("getInstitutionCredentialsHandler", () => {
  it("returns with the institution credentials", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
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

    await getInstitutionCredentialsHandler(req, res);

    expect(res.send).toHaveBeenCalledWith([
      {
        field_name: testExampleCredentials.field_name,
        field_type: 3,
        guid: testExampleCredentials.id,
        id: testExampleCredentials.id,
        label: TEST_EXAMPLE_A_LABEL_TEXT,
      },
    ]);
  });
});
