import { http, HttpResponse } from "msw";
import config from "../../config";
import { server } from "../../test/testServer";

export interface RequestLogEntry {
  method: string;
  eventType: string;
  connectionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers: Record<string, any>;
}

export default function setupPerformanceHandlers(
  events: Array<
    | "connectionStart"
    | "connectionPause"
    | "connectionSuccess"
    | "connectionResume"
  > = [
    "connectionStart",
    "connectionPause",
    "connectionSuccess",
    "connectionResume",
  ],
): RequestLogEntry[] {
  const requestLog: RequestLogEntry[] = [];

  const handlers = events.map((eventType) => {
    const methodType = eventType === "connectionStart" ? "POST" : "PUT";
    const method = eventType === "connectionStart" ? http.post : http.put;
    return method(
      `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/${eventType}`,
      async ({ request, params }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          method: methodType,
          eventType,
          connectionId: String(params.connectionId),
          headers: Object.fromEntries(request.headers.entries()),
        };
        try {
          payload.body = await request.json();
        } catch (error) {
          // Handle error
        }
        requestLog.push(payload);
        return HttpResponse.json({});
      },
    );
  });

  server.use(...handlers);

  return requestLog;
}
