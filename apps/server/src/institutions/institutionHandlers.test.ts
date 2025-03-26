import type { Response } from "express";
import { ComboJobTypes } from "@repo/utils";
import { ConnectApi } from "../connect/connectApi";
import type { GetInstitutionCredentialsRequest } from "./institutionHandlers";
import { getInstitutionCredentialsHandler } from "./institutionHandlers";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import {
  TEST_EXAMPLE_A_LABEL_TEXT,
  testExampleCredentials,
} from "../test-adapter/constants";

describe("institutionEndpoints", () => {
  describe("getInstitutionCredentialsHandler", () => {
    it("returns with the institution credentials", async () => {
      const context = {
        jobTypes: [ComboJobTypes.TRANSACTIONS],
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      };

      const connectApi = new ConnectApi({ context });

      await connectApi.init();

      const req = {
        connectApi,
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
});
