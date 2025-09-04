import { ComboJobTypes } from "@repo/utils";
import {
  getInstitutionCredentialsHandler,
  type GetInstitutionCredentialsRequest,
} from "./getInstitutionCredentialsHandler";
import type { Response } from "express";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import {
  INSTITUTION_CREDENTIALS_BY_ID_PATH,
  mxTestData,
  waitFor,
} from "@repo/utils-dev-dependency";
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";
import { setPerformanceSessionId } from "../services/performanceTracking";
import { server } from "../test/testServer";
import { http, HttpResponse } from "msw";
import {
  getCurrentJobIdFromContext,
  setCurrentJobIdOnContext,
} from "../shared/utils/context";

const { institutionCredentialsData: mxInstitutionCredentialsData } = mxTestData;

describe("getInstitutionCredentialsHandler", () => {
  describe("shouldRecordPerformance", () => {
    describe("success", () => {
      it("sends resume and pause performance events with the correct props", async () => {
        const req = {
          params: {
            institution_guid: "test",
          },
          context: {
            aggregator: MX_AGGREGATOR_STRING,
          },
        } as unknown as GetInstitutionCredentialsRequest;

        const res = {
          send: jest.fn(),
        } as unknown as Response;

        const requestLog = setupPerformanceHandlers([
          "connectionPause",
          "connectionResume",
        ]);

        const performanceSessionId = setPerformanceSessionId(req);

        await getInstitutionCredentialsHandler(req, res);

        await waitFor(() => {
          expect(requestLog).toHaveLength(2);
        });

        expect(requestLog[0]).toEqual(
          expect.objectContaining({
            method: "PUT",
            eventType: "connectionResume",
            connectionId: performanceSessionId,
            body: { shouldRecordResult: undefined },
          }),
        );

        expect(requestLog[1]).toEqual(
          expect.objectContaining({
            method: "PUT",
            eventType: "connectionPause",
            connectionId: performanceSessionId,
            body: { shouldRecordResult: undefined },
          }),
        );

        expect(res.send).toHaveBeenCalled();
      });
    });

    describe("failure", () => {
      it("sends resume and pause performance events with the correct props and sets shouldRecordResult to true and responds with a 400", async () => {
        const req = {
          params: {
            institution_guid: "test",
          },
          context: {
            aggregator: MX_AGGREGATOR_STRING,
          },
        } as unknown as GetInstitutionCredentialsRequest;

        const res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn(),
        } as unknown as Response;

        const requestLog = setupPerformanceHandlers([
          "connectionPause",
          "connectionResume",
        ]);

        const performanceSessionId = setPerformanceSessionId(req);

        server.use(
          http.get(
            INSTITUTION_CREDENTIALS_BY_ID_PATH,
            () => new HttpResponse(null, { status: 400 }),
          ),
        );

        await getInstitutionCredentialsHandler(req, res);

        await waitFor(() => {
          expect(requestLog).toHaveLength(2);
        });

        expect(requestLog[0]).toEqual(
          expect.objectContaining({
            method: "PUT",
            eventType: "connectionResume",
            connectionId: performanceSessionId,
            body: { shouldRecordResult: undefined },
          }),
        );

        expect(requestLog[1]).toEqual(
          expect.objectContaining({
            method: "PUT",
            eventType: "connectionPause",
            connectionId: performanceSessionId,
            body: { shouldRecordResult: true },
          }),
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  describe("shouldn't record performance for refresh connections", () => {
    describe("success", () => {
      it("doesn't send resume or pause performance events", async () => {
        const req = {
          params: {
            institution_guid: "test",
          },
          context: {
            aggregator: MX_AGGREGATOR_STRING,
            connectionId: "refreshConnectionId",
          },
        } as unknown as GetInstitutionCredentialsRequest;

        const res = {
          send: jest.fn(),
        } as unknown as Response;

        const requestLog = setupPerformanceHandlers([
          "connectionPause",
          "connectionResume",
        ]);

        setPerformanceSessionId(req);

        await getInstitutionCredentialsHandler(req, res);

        expect(requestLog).toHaveLength(0);

        expect(res.send).toHaveBeenCalled();
      });
    });

    describe("failure", () => {
      it("doesn't send resume or pause performance events and responds with a 400", async () => {
        const req = {
          params: {
            institution_guid: "test",
          },
          context: {
            aggregator: MX_AGGREGATOR_STRING,
            connectionId: "refreshConnectionId",
          },
        } as unknown as GetInstitutionCredentialsRequest;

        const res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn(),
        } as unknown as Response;

        const requestLog = setupPerformanceHandlers([
          "connectionPause",
          "connectionResume",
        ]);

        setPerformanceSessionId(req);

        server.use(
          http.get(
            INSTITUTION_CREDENTIALS_BY_ID_PATH,
            () => new HttpResponse(null, { status: 400 }),
          ),
        );

        await getInstitutionCredentialsHandler(req, res);

        expect(requestLog).toHaveLength(0);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  it("sets the currentjobid as null and returns with the institution credentials", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      aggregator: MX_AGGREGATOR_STRING,
    };

    const req = {
      context,
      params: {
        institution_guid: "test",
      },
    } as unknown as GetInstitutionCredentialsRequest;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    const institutionCredentials = mxInstitutionCredentialsData.credentials;

    setCurrentJobIdOnContext({ currentJobId: "test", req });

    expect(getCurrentJobIdFromContext(req)).toBe("test");

    await getInstitutionCredentialsHandler(req, res);

    expect(getCurrentJobIdFromContext(req)).toBe(null);

    expect(res.send).toHaveBeenCalledWith([
      {
        field_name: institutionCredentials[0].field_name,
        field_type: 1,
        guid: institutionCredentials[0].guid,
        id: institutionCredentials[0].guid,
        label: institutionCredentials[0].label,
      },
      {
        field_name: institutionCredentials[1].field_name,
        field_type: 3,
        guid: institutionCredentials[1].guid,
        id: institutionCredentials[1].guid,
        label: institutionCredentials[1].label,
      },
    ]);
  });
});
