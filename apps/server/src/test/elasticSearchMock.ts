import type { DiagnosticResult } from '@elastic/elasticsearch'
import { errors } from '@elastic/elasticsearch'
import Mock from '@elastic/elasticsearch-mock'

export const ElasticSearchMock = new Mock()

interface ElasticSearchErrorArgs {
  message: string
  statusCode: number
}

export function elasticSearchMockError(args: ElasticSearchErrorArgs) {
  const { message, statusCode } = args
  return new errors.ResponseError({
    body: { errors: { message }, status: statusCode },
    statusCode,
    warnings: ['test'],
    meta: {
      context: {},
      name: 'test',
      request: {
        params: { method: 'test', path: 'test' },
        options: {},
        id: 'test'
      },
      connection: null,
      attempts: 1,
      aborted: false
    }
  } satisfies DiagnosticResult<unknown, unknown>)
}
