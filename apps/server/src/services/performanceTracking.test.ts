import config from "../config";
import { http, HttpResponse } from "msw";
import { server } from "../test/testServer";
import {
  recordConnectionPauseEvent,
  recordConnectionResumeEvent,
  recordStartEvent,
  recordSuccessEvent,
} from "./performanceTracking";
import { ComboJobTypes } from "@repo/utils";
import { mockAccessToken } from "../test/testData/auth0";
import * as logger from "../infra/logger";

interface RequestLogEntry {
  method: string;
  eventType: string;
  connectionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers: Record<string, any>;
}

describe("performanceTracking", () => {
  let requestLog: RequestLogEntry[] = [];

  beforeEach(() => {
    requestLog = [];
    server.use(
      http.post(
        `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionStart`,
        async ({ request, params }) => {
          requestLog.push({
            method: "POST",
            eventType: "connectionStart",
            connectionId: String(params.connectionId),
            body: await request.json(),
            headers: Object.fromEntries(request.headers.entries()),
          });
          return HttpResponse.json({ ok: true });
        },
      ),
      http.put(
        `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
        ({ request, params }) => {
          requestLog.push({
            method: "PUT",
            eventType: "connectionSuccess",
            connectionId: String(params.connectionId),
            headers: Object.fromEntries(request.headers.entries()),
          });
          return HttpResponse.json({ ok: true });
        },
      ),
      http.put(
        `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionPause`,
        ({ request, params }) => {
          requestLog.push({
            method: "PUT",
            eventType: "connectionPause",
            connectionId: String(params.connectionId),
            headers: Object.fromEntries(request.headers.entries()),
          });
          return HttpResponse.json({ ok: true });
        },
      ),
      http.put(
        `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionResume`,
        ({ request, params }) => {
          requestLog.push({
            method: "PUT",
            eventType: "connectionResume",
            connectionId: String(params.connectionId),
            headers: Object.fromEntries(request.headers.entries()),
          });
          return HttpResponse.json({ ok: true });
        },
      ),
    );
  });

  it("calls connectionStart with correct payload and headers", async () => {
    await recordStartEvent({
      aggregatorId: "agg1",
      connectionId: "conn1",
      institutionId: "inst1",
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    });

    expect(requestLog.length).toBe(1);
    expect(requestLog[0]).toEqual(
      expect.objectContaining({
        method: "POST",
        eventType: "connectionStart",
        connectionId: "conn1",
        body: {
          aggregatorId: "agg1",
          institutionId: "inst1",
          jobTypes: [ComboJobTypes.TRANSACTIONS],
        },
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
          "content-type": expect.stringContaining("application/json"),
        }),
      }),
    );
  });

  it("calls connectionSuccess with correct method and headers", async () => {
    await recordSuccessEvent("conn2");

    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionSuccess",
        connectionId: "conn2",
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("calls connectionPause with correct method and headers", async () => {
    await recordConnectionPauseEvent("conn3");
    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionPause",
        connectionId: "conn3",
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("calls connectionResume with correct method and headers", async () => {
    await recordConnectionResumeEvent("conn4");
    expect(requestLog.length).toBe(1);
    const req = requestLog[0];
    expect(req).toEqual(
      expect.objectContaining({
        method: "PUT",
        eventType: "connectionResume",
        connectionId: "conn4",
        headers: expect.objectContaining({
          authorization: `Bearer ${mockAccessToken}`,
        }),
      }),
    );
  });

  it("logs and returns early if UCP credentials are missing", async () => {
    const debugSpy = jest.spyOn(logger, "debug");
    const oldConfig = { ...config };
    config.UCP_CLIENT_ID = undefined;
    config.UCP_CLIENT_SECRET = undefined;

    await recordSuccessEvent("conn5");
    expect(debugSpy).toHaveBeenCalledWith(
      "Performance disabled until UCP credentials are configured",
    );

    config.UCP_CLIENT_ID = oldConfig.UCP_CLIENT_ID;
    config.UCP_CLIENT_SECRET = oldConfig.UCP_CLIENT_SECRET;
  });

  it("logs error if fetch fails", async () => {
    server.use(
      http.put(
        `${config.PERFORMANCE_SERVICE_URL}/events/:connectionId/connectionSuccess`,
        () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        },
      ),
    );

    const debugSpy = jest.spyOn(logger, "debug");
    await recordSuccessEvent("conn6");
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Performance event (connectionSuccess) failed: 500 Internal Server Error",
      ),
    );
  });

  it("logs error if fetch throws", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("network fail"));
    const debugSpy = jest.spyOn(logger, "debug");

    await recordSuccessEvent("conn7");
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Performance event (connectionSuccess) failed with error:",
      ),
      expect.any(Error),
    );

    fetchSpy.mockRestore();
  });
});
