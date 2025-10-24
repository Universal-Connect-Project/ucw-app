import type { Request, Response } from "express";
import {
  invalidAggregatorString,
  withValidateAggregatorInPath,
  withValidateAggregatorInQueryParams,
} from "./validators";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";

const successString = "success!";

const validatedHandler = withValidateAggregatorInPath(
  (req: Request, res: Response) => {
    res.send(successString);
  },
);

const validatedQueryHandler = withValidateAggregatorInQueryParams(
  (req: Request, res: Response) => {
    res.send(successString);
  },
);

describe("validators", () => {
  describe("withValidateAggregatorInPath", () => {
    it("fails with an error if the aggregator is missing and doesn't call the handler", () => {
      const req = {
        params: {},
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

      validatedHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(
        "&#x22;aggregator&#x22; is required",
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("fails with an error if the aggregator is wrong and doesn't call the handler", () => {
      const req = {
        params: {
          aggregator: "junk",
        },
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

      validatedHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("calls the handler if the aggregator is valid", () => {
      const req = {
        params: {
          aggregator: MX_AGGREGATOR_STRING,
        },
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

      validatedHandler(req, res);

      expect(res.send).not.toHaveBeenCalledWith(invalidAggregatorString);
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(successString);
    });
  });

  describe("withValidateAggregatorInQueryParams", () => {
    it("fails with an error if the aggregator is missing and doesn't call the handler", () => {
      const req = {
        query: {},
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

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
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

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
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

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
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

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
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

      validatedQueryHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });

    it("fails with an error if aggregator is undefined", () => {
      const req = {
        query: {
          aggregator: undefined as string | undefined,
        },
      };

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

      validatedQueryHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(
        "&#x22;aggregator&#x22; is required",
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).not.toHaveBeenCalledWith(successString);
    });
  });
});
