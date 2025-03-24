import { ComboJobTypes } from "@repo/utils";
import SophtronV2Client from "./apiClient.v2";
import { server } from "./test/testServer";
import { http, HttpResponse } from "msw";
import {
  SOPHTRON_CREATE_MEMBER_PATH,
  SOPHTRON_UPDATE_MEMBER_PATH,
} from "./test/handlers";
import { createMemberData } from "./test/testData/sophtronMember";

const client = new SophtronV2Client({
  aggregatorCredentials: {
    clientId: "test",
    secret: "test",
  },
});

const customerId = "testCustomerId";
const username = "testUsername";
const password = "testPassword";
const institutionId = "testInstitutionId";

describe("Sophtron api client v2", () => {
  describe("createMember", () => {
    it("creates a member with mapped job types", async () => {
      let body;
      let parameters;

      const jobTypes = Object.values(ComboJobTypes);

      server.use(
        http.post(SOPHTRON_CREATE_MEMBER_PATH, async ({ params, request }) => {
          body = await request.json();
          parameters = { ...params };

          return HttpResponse.json(createMemberData);
        }),
      );

      await client.createMember(
        customerId,
        jobTypes,
        username,
        password,
        institutionId,
      );

      expect(parameters.userId).toEqual(customerId);
      expect(parameters.jobTypes).toEqual(
        "verification|identity|aggregate|history",
      );

      expect(body).toEqual({
        UserName: username,
        Password: password,
        InstitutionID: institutionId,
      });
    });
  });

  describe("updateMember", () => {
    it("updates a member with mapped job types", async () => {
      let body;
      let parameters;

      const jobTypes = Object.values(ComboJobTypes);

      server.use(
        http.put(SOPHTRON_UPDATE_MEMBER_PATH, async ({ params, request }) => {
          body = await request.json();
          parameters = { ...params };

          return HttpResponse.json(createMemberData);
        }),
      );

      const memberId = "testMemberId";

      await client.updateMember(
        customerId,
        memberId,
        jobTypes,
        username,
        password,
      );

      expect(parameters.customerId).toEqual(customerId);
      expect(parameters.memberId).toEqual(memberId);
      expect(parameters.jobTypes).toEqual(
        "verification|identity|aggregate|history",
      );

      expect(body).toEqual({
        UserName: username,
        Password: password,
      });
    });
  });
});
