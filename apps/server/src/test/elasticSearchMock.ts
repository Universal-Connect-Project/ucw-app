import { errors } from "@opensearch-project/opensearch";
import OpenSearchMock from "@short.io/opensearch-mock";

export const ElasticSearchMock = new OpenSearchMock();

interface ElasticSearchErrorArgs {
  message: string;
  statusCode: number;
}

export function elasticSearchMockError(args: ElasticSearchErrorArgs) {
  const { message, statusCode } = args;
  return new errors.ResponseError({
    body: { errors: { message }, status: statusCode },
    statusCode,
    headers: {},
    warnings: ["test"],
    meta: {
      context: {},
      name: "test",
      request: {
        params: { method: "test", path: "test" },
        options: {},
        id: "test",
      },
      connection: null,
      attempts: 1,
      aborted: false,
    },
  });
}
