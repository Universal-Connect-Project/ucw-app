import { describe, expect, it } from "vitest";
import connectWidgetApiService from "./connectWidgetApiService";
import {
  CREATE_MEMBER_URL,
  INSTITUTION_BY_GUID_MOCK_URL,
  INSTITUTION_CREDENTIALS_MOCK_URL,
  JOB_BY_GUID_MOCK_URL,
  MEMBER_BY_GUID_MOCK_URL,
  MEMBER_CREDENTIALS_MOCK_URL,
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
} from "@repo/utils";
import { recommendedInstitutions } from "../shared/test/testData/recommendedInstitutions";
import server from "../shared/test/testServer";
import { http, HttpResponse } from "msw";
import { searchedInstitutions } from "../shared/test/testData/searchedInstitutions";
import {
  credentials,
  memberCredentials,
} from "../shared/test/testData/credentials";
import { institutionByGuid } from "../shared/test/testData/institutionByGuid";
import { createMemberResponse } from "../shared/test/testData/member";
import { jobResponse } from "../shared/test/testData/job";
import { memberByGuidRespose } from "../shared/test/testData/memberByGuid";

describe("connectWidgetApiService", () => {
  describe("addMember", () => {
    it("resolves with a member", async () => {
      expect(await connectWidgetApiService.addMember("test")).toEqual(
        createMemberResponse,
      );
    });

    it("throws an error on failure", async () => {
      server.use(
        http.post(
          CREATE_MEMBER_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(connectWidgetApiService.addMember("test")).rejects.toThrow();
    });
  });

  describe("getInstitutionCredentials", () => {
    it("resolves with credentials", async () => {
      expect(
        await connectWidgetApiService.getInstitutionCredentials("test"),
      ).toEqual(credentials);
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          INSTITUTION_CREDENTIALS_MOCK_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.getInstitutionCredentials("test"),
      ).rejects.toThrow();
    });
  });

  describe("getMemberCredentials", () => {
    it("resolves with credentials", async () => {
      expect(
        await connectWidgetApiService.getMemberCredentials("test"),
      ).toEqual(memberCredentials);
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          MEMBER_CREDENTIALS_MOCK_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.getMemberCredentials("test"),
      ).rejects.toThrow();
    });
  });

  describe("loadJob", () => {
    it("resolves with an institution", async () => {
      expect(await connectWidgetApiService.loadJob("test")).toEqual(
        jobResponse,
      );
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          JOB_BY_GUID_MOCK_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(connectWidgetApiService.loadJob("test")).rejects.toThrow();
    });
  });

  describe("loadInstitutionByGuid", () => {
    it("resolves with an institution", async () => {
      expect(
        await connectWidgetApiService.loadInstitutionByGuid("test"),
      ).toEqual(institutionByGuid);
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          INSTITUTION_BY_GUID_MOCK_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.loadInstitutionByGuid("test"),
      ).rejects.toThrow();
    });
  });

  describe("loadMemberByGuid", () => {
    it("resolves with an institution", async () => {
      expect(await connectWidgetApiService.loadMemberByGuid("test")).toEqual(
        memberByGuidRespose,
      );
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          MEMBER_BY_GUID_MOCK_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.loadMemberByGuid("test"),
      ).rejects.toThrow();
    });
  });

  describe("loadPopularInstitutions", () => {
    it("resolves with popular institutions", async () => {
      expect(await connectWidgetApiService.loadPopularInstitutions()).toEqual(
        recommendedInstitutions,
      );
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          RECOMMENDED_INSTITUTIONS_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.loadPopularInstitutions(),
      ).rejects.toThrow();
    });
  });

  describe("loadInstitutions", () => {
    const loadParams = {
      page: 1,
      per_page: 25,
      search_name: "test",
    };

    it("resolves with institutions", async () => {
      expect(
        await connectWidgetApiService.loadInstitutions(loadParams),
      ).toEqual(searchedInstitutions);
    });

    it("throws an error on failure", async () => {
      server.use(
        http.get(
          SEARCH_INSTITUTIONS_URL,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      await expect(
        connectWidgetApiService.loadInstitutions(loadParams),
      ).rejects.toThrow();
    });
  });
});
