import { http, HttpResponse } from "msw";
import { INSTRUMENTATION_URL } from "../../api/api";
import { recommendedInstitutions } from "./testData/recommendedInstitutions";
import { RECOMMENDED_INSTITUTIONS_URL } from "../../api/connectWidgetApiService";

const handlers = [
  http.post(INSTRUMENTATION_URL, () => HttpResponse.json({})),
  http.get(RECOMMENDED_INSTITUTIONS_URL, () =>
    HttpResponse.json(recommendedInstitutions),
  ),
];

export default handlers;
