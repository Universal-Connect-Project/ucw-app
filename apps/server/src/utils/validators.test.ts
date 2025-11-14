import type { Request, Response } from "express";
import {
  invalidAggregatorString,
  withValidateAggregatorInQueryParams,
  connectionIdNotInQueryMiddleware,
} from "./validators";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";

const successString = "success!";

const validatedQueryHandler = withValidateAggregatorInQueryParams(
  (req: Request, res: Response) => {
    res.send(successString);
  },
);

describe("validators", () => {
  describe("withValidateAggregatorInQueryParams", () => {
    it("fails with an error if the aggregator is missing and doesn't call the handler", () => {
      const req = {
        query: {},
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      validatedQueryHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(
        "&#x22;aggregator&#x22; is required",
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("fails with an error if the aggregator is wrong and doesn't call the handler", () => {
      const req = {
        query: {
          aggregator: "invalid_aggregator",
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      validatedQueryHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("fails with an error if the aggregator is empty string and doesn't call the handler", () => {
      const req = {
        query: {
          aggregator: "",
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      validatedQueryHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("calls the handler if the aggregator is valid", () => {
      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      validatedQueryHandler(req, res);

      expect(res.send).not.toHaveBeenCalledWith(invalidAggregatorString);
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(successString);
    });

    it("fails with an error if aggregator is null", () => {
      const req = {
        query: {
          aggregator: null as string | null,
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      validatedQueryHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("fails with an error if aggregator is undefined", () => {
      const req = {
        query: {
          aggregator: undefined as string | undefined,
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      validatedQueryHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(
        "&#x22;aggregator&#x22; is required",
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });
  });

  describe("connectionIdNotInQueryMiddleware", () => {
    it("calls next() when connectionId is not in query params", () => {
      const req = {
        query: {
          aggregator: "mx",
          userId: "testUser",
        },
        method: "GET",
        path: "/api/test",
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      connectionIdNotInQueryMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it("returns 400 error when connectionId is in query params", () => {
      const req = {
        query: {
          aggregator: "mx",
          userId: "testUser",
          connectionId: "test-connection-id",
        },
        method: "GET",
        path: "/api/test",
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      connectionIdNotInQueryMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        "connectionId is not allowed in query parameters, add it in the UCW-Connection-Id header",
      );
    });
  });
});
