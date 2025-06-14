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
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";

describe("performanceTracking", () => {
  it("calls connectionStart with correct payload and headers", async () => {
    const requestLog = setupPerformanceHandlers(["connectionStart"]);

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
    const requestLog = setupPerformanceHandlers(["connectionSuccess"]);

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
    const requestLog = setupPerformanceHandlers(["connectionPause"]);

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
    const requestLog = setupPerformanceHandlers(["connectionResume"]);

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

  it("fails if ucp credentials are not configured to get access token", async () => {
    const debugSpy = jest.spyOn(logger, "debug");

    server.use(
      http.post(config.AUTH0_TOKEN_URL, async () => {
        return new HttpResponse(null, {
          status: 401,
          statusText: "Unauthorized",
        });
      }),
    );

    await recordSuccessEvent("conn5");
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "UCP credentials need to be configured for performance features",
      ),
    );
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
