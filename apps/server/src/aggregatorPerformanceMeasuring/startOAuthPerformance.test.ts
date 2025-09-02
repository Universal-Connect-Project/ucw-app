import type { Response } from "express";
import {
  startOAuthPerformance,
  type StartOAuthPerformanceRequest,
} from "./startOAuthPerformance";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";
import { delay, waitFor } from "@repo/utils-dev-dependency";
import { setPerformanceSessionId } from "../services/performanceTracking";
import { getPerformanceObject } from "./utils";
import { FINICITY_AGGREGATOR_STRING } from "@repo/finicity-adapter";

describe("startOAuthPerformance", () => {
  describe("connection pause", () => {
    it("sends a connection pause event with shouldRecordResult as true if shouldRecordPerformance", async () => {
      const req = {
        body: { connectionId: "testConnectionId" },
        context: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as StartOAuthPerformanceRequest;
      const res = { status: jest.fn() } as unknown as Response;

      const requestLog = setupPerformanceHandlers(["connectionPause"]);
      const performanceSessionId = setPerformanceSessionId(req);

      await startOAuthPerformance(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      await waitFor(() => expect(requestLog).toHaveLength(1));

      expect(requestLog[0]).toEqual(
        expect.objectContaining({
          method: "PUT",
          eventType: "connectionPause",
          connectionId: performanceSessionId,
          body: { shouldRecordResult: true },
        }),
      );
    });

    it("doesn't send a connection pause event if !shouldRecordPerformance", async () => {
      const req = {
        body: { connectionId: "testConnectionId" },
        context: {
          aggregator: MX_AGGREGATOR_STRING,
          connectionId: "testConnectionId",
        },
      } as StartOAuthPerformanceRequest;
      const res = { status: jest.fn() } as unknown as Response;

      const requestLog = setupPerformanceHandlers(["connectionPause"]);

      await startOAuthPerformance(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      await delay(1000);

      expect(requestLog).toHaveLength(0);
    });
  });

  describe("performance polling", () => {
    it("starts performance polling if requiresPollingForPerformance", async () => {
      const req = {
        body: { connectionId: "testConnectionId" },
        context: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as StartOAuthPerformanceRequest;
      const res = { status: jest.fn() } as unknown as Response;

      const performanceSessionId = setPerformanceSessionId(req);

      await startOAuthPerformance(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(await getPerformanceObject(performanceSessionId)).toEqual(
        expect.objectContaining({
          aggregatorId: MX_AGGREGATOR_STRING,
          connectionId: "testConnectionId",
          lastUiUpdateTimestamp: expect.any(Number),
          paused: false,
          performanceSessionId,
        }),
      );
    });

    it("doesn't start performance polling if !requiresPollingForPerformance", async () => {
      const req = {
        body: { connectionId: "testConnectionId" },
        context: {
          aggregator: FINICITY_AGGREGATOR_STRING,
        },
      } as StartOAuthPerformanceRequest;
      const res = { status: jest.fn() } as unknown as Response;

      const performanceSessionId = setPerformanceSessionId(req);

      await startOAuthPerformance(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(await getPerformanceObject(performanceSessionId)).toBeUndefined();
    });
  });
});
