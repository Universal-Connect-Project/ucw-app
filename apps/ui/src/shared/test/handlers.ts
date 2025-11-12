import { http, HttpResponse } from "msw";
import { recommendedInstitutions } from "./testData/recommendedInstitutions";
import {
  CREATE_MEMBER_URL,
  INSTITUTION_BY_GUID_MOCK_URL,
  INSTITUTION_CREDENTIALS_MOCK_URL,
  INSTRUMENTATION_URL,
  JOB_BY_GUID_MOCK_URL,
  MEMBER_BY_GUID_MOCK_URL,
  MEMBER_CREDENTIALS_MOCK_URL,
  MEMBERS_URL,
  OAUTH_START_URL,
  OAUTH_STATE_MOCK_URL,
  OAUTH_STATES_URL,
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
  UPDATE_MFA_MOCK_URL,
} from "@repo/utils";
import { searchedInstitutions } from "./testData/searchedInstitutions";
import { institutionByGuid } from "./testData/institutionByGuid";
import { credentials, memberCredentials } from "./testData/credentials";
import { createMemberResponse } from "./testData/member";
import { jobResponse } from "./testData/job";
import { memberByGuidRespose } from "./testData/memberByGuid";
import { membersResponse } from "./testData/members";
import { updateMFAResponse } from "./testData/updateMFA";
import { oauthStatesResponse } from "./testData/oauthStates";
import { oauthStateResponse } from "./testData/oauthState";

const handlers = [
  http.post(`${INSTRUMENTATION_URL}/:token`, () => HttpResponse.json({})),
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
  http.put(UPDATE_MFA_MOCK_URL, () => HttpResponse.json(updateMFAResponse)),
  http.get(OAUTH_STATES_URL, () => HttpResponse.json(oauthStatesResponse)),
  http.get(OAUTH_STATE_MOCK_URL, () => HttpResponse.json(oauthStateResponse)),
  http.get(OAUTH_START_URL, () => HttpResponse.json({})),
];

export default handlers;
