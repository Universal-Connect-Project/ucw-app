import he from "he";
import Joi from "joi";
import { aggregators } from "../adapterSetup";
import { error as _error } from "../infra/logger";
import type { NextFunction, Request, Response } from "express";

export const invalidAggregatorString = `&#x22;aggregator&#x22; must be one of [${aggregators.join(", ")}]`;

export const createAggregatorValidator = () =>
  Joi.string()
    .valid(...aggregators)
    .required();

export const withValidateAggregatorInQueryParams =
  // eslint-disable-next-line @typescript-eslint/ban-types
  (handler: Function) => async (req: Request, res: Response) => {
    const schema = Joi.object({
      aggregator: createAggregatorValidator(),
    });

    const { error } = schema.validate({
      aggregator: req.query.aggregator,
    });

    if (error) {
      res.status(400);
      res.send(he.encode(error.details[0].message));
      return;
    }

    await handler(req, res);
  };

export const connectionIdNotInQueryMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.query.connectionId) {
    _error(`connectionId found in query params for ${req.method} ${req.path}`, {
      query: req.query,
      path: req.path,
      method: req.method,
    });

    res.status(400);
    res.send(
      "connectionId is not allowed in query parameters, add it in the UCW-Connection-Id header",
    );
    return;
  }

  next();
};
