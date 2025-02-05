import { http, HttpResponse } from "msw";
import { recommendedInstitutions } from "./testData/recommendedInstitutions";
import {
  INSTITUTION_BY_GUID_MOCK_URL,
  INSTITUTION_CREDENTIALS_MOCK_URL,
  INSTRUMENTATION_MOCK_URL,
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
} from "@repo/utils";
import { searchedInstitutions } from "./testData/searchedInstitutions";
import { institutionByGuid } from "./testData/institutionByGuid";
import { credentials } from "./testData/credentials";

const handlers = [
  http.post(INSTRUMENTATION_MOCK_URL, () => HttpResponse.json({})),
  http.get(RECOMMENDED_INSTITUTIONS_URL, () =>
    HttpResponse.json(recommendedInstitutions),
  ),
  http.get(SEARCH_INSTITUTIONS_URL, () =>
    HttpResponse.json(searchedInstitutions),
  ),
  http.get(INSTITUTION_BY_GUID_MOCK_URL, () =>
    HttpResponse.json(institutionByGuid),
  ),
  http.get(INSTITUTION_CREDENTIALS_MOCK_URL, () =>
    HttpResponse.json(credentials),
  ),
];

export default handlers;
