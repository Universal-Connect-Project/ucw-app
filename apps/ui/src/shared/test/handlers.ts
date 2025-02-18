import { http, HttpResponse } from "msw";
import { recommendedInstitutions } from "./testData/recommendedInstitutions";
import {
  CREATE_MEMBER_URL,
  INSTITUTION_BY_GUID_MOCK_URL,
  INSTITUTION_CREDENTIALS_MOCK_URL,
  INSTRUMENTATION_MOCK_URL,
  JOB_BY_GUID_MOCK_URL,
  MEMBER_BY_GUID_MOCK_URL,
  MEMBER_CREDENTIALS_MOCK_URL,
  MEMBERS_URL,
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
} from "@repo/utils";
import { searchedInstitutions } from "./testData/searchedInstitutions";
import { institutionByGuid } from "./testData/institutionByGuid";
import { credentials, memberCredentials } from "./testData/credentials";
import { createMemberResponse } from "./testData/member";
import { jobResponse } from "./testData/job";
import { memberByGuidRespose } from "./testData/memberByGuid";
import { membersResponse } from "./testData/members";

const handlers = [
  http.post(INSTRUMENTATION_MOCK_URL, () => HttpResponse.json({})),
  http.get(RECOMMENDED_INSTITUTIONS_URL, () =>
    HttpResponse.json(recommendedInstitutions),
  ),
  http.get(SEARCH_INSTITUTIONS_URL, () =>
    HttpResponse.json(searchedInstitutions),
  ),
  http.get(JOB_BY_GUID_MOCK_URL, () => HttpResponse.json(jobResponse)),
  http.get(INSTITUTION_BY_GUID_MOCK_URL, () =>
    HttpResponse.json(institutionByGuid),
  ),
  http.get(INSTITUTION_CREDENTIALS_MOCK_URL, () =>
    HttpResponse.json(credentials),
  ),
  http.get(MEMBER_BY_GUID_MOCK_URL, () =>
    HttpResponse.json(memberByGuidRespose),
  ),
  http.get(MEMBERS_URL, () => HttpResponse.json(membersResponse)),
  http.get(MEMBER_CREDENTIALS_MOCK_URL, () =>
    HttpResponse.json(memberCredentials),
  ),
  http.post(CREATE_MEMBER_URL, () => HttpResponse.json(createMemberResponse)),
];

export default handlers;
