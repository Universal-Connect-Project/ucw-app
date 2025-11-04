import type { Response } from "express";
import Joi from "joi";
import he from "he";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { withValidateAggregatorInQueryParams } from "../utils/validators";
import { userlessAggregatorIds, type Aggregator } from "../adapterSetup";
import handleError from "../utils/errorHandler";

const UserDeleteParamsSchema = Joi.object({
  aggregator: Joi.string().required(),
  userId: Joi.string().required(),
});

const ConnectionDeleteParamsSchema = Joi.object({
  aggregator: Joi.string().required(),
  userId: Joi.when("aggregator", {
    is: Joi.string().valid(...userlessAggregatorIds),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),
  connectionId: Joi.string().required(),
});

const validateRequestParams = <T extends Record<string, unknown>>(
  req: { query: T; headers?: { [key: string]: string } },
  res: Response,
  schema: Joi.ObjectSchema,
): { isValid: boolean; connectionId?: string } => {
  const connectionId =
    req.headers?.["UCW-Connection-Id"] || req.headers?.["ucw-connection-id"];

  const { error } = schema.validate({
    ...req.query,
    ...(connectionId && { connectionId }),
  });

  if (error) {
    res.status(400);
    res.send(he.encode(error.details[0].message));
    return { isValid: false };
  }

  return { isValid: true, connectionId };
};

interface UserDeleteParameters extends Record<string, unknown> {
  aggregator: Aggregator;
  userId: string;
}

export interface UserDeleteRequest {
  query: UserDeleteParameters;
  headers?: { [key: string]: string };
}

export const userDeleteHandler = withValidateAggregatorInQueryParams(
  async (req: UserDeleteRequest, res: Response) => {
    const validation = validateRequestParams(req, res, UserDeleteParamsSchema);
    if (!validation.isValid) {
      return;
    }

    const { userId, aggregator } = req.query;

    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
      const failIfUserNotFound = true;
      const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
        userId,
        failIfUserNotFound,
      );
      const ret = await aggregatorAdapter.DeleteUser(aggregatorUserId);
      res.status(ret.status);
      res.send(ret.data);
    } catch (error) {
      handleError({ error, res });
    }
  },
);

interface ConnectionDeleteParameters extends Record<string, unknown> {
  aggregator: Aggregator;
  userId: string;
  connectionId: string;
}

export interface ConnectionDeleteRequest {
  query: ConnectionDeleteParameters;
  headers?: { [key: string]: string };
}

export const userConnectionDeleteHandler = withValidateAggregatorInQueryParams(
  async (req: ConnectionDeleteRequest, res: Response) => {
    const validation = validateRequestParams(
      req,
      res,
      ConnectionDeleteParamsSchema,
    );
    if (!validation.isValid) {
      return;
    }

    const { aggregator, userId } = req.query;

    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
      const resolvedUserId = await aggregatorAdapter.ResolveUserId(userId);
      const ret = await aggregatorAdapter.DeleteConnection(
        validation.connectionId!,
        resolvedUserId,
      );
      res.status(ret.status);
      res.send(ret.data);
    } catch (error) {
      handleError({ error, res });
    }
  },
);
