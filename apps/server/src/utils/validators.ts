import he from "he";
import Joi from "joi";
import { aggregators } from "../adapterSetup";

export const invalidAggregatorString = `&#x22;aggregator&#x22; must be one of [${aggregators.join(", ")}]`;

export const createAggregatorValidator = () =>
  Joi.string()
    .valid(...aggregators)
    .required();

export const withValidateAggregatorInPath =
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  (handler: Function) => async (req: any, res: any) => {
    const schema = Joi.object({
      aggregator: createAggregatorValidator(),
    });

    const { error } = schema.validate({
      aggregator: req.params.aggregator,
    });

    if (error) {
      res.status(400);
      res.send(he.encode(error.details[0].message));

      return;
    }

    await handler(req, res);
  };

export const withValidateAggregatorInQueryParams =
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
  (handler: Function) => async (req: any, res: any) => {
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
