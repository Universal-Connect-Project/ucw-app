/* eslint-disable @typescript-eslint/naming-convention */
import type { Response } from "express";
import * as logger from "../infra/logger";
import he from "he";
import Joi from "joi";

import { VCDataTypes } from "@repo/utils";
import type { Aggregator } from "../shared/contract";
import { withValidateAggregatorInQueryParams } from "../utils/validators";
import { createAggregatorWidgetAdapter, getData, getVC } from "../adapterIndex";
import handleError from "../utils/errorHandler";
import { userlessAggregatorIds } from "../adapterSetup";

export const connectionIdHeaderRequiredMessage =
  "UCW-Connection-Id header is required";

const validateRequestAndConnectionId = <T extends Record<string, unknown>>(
  req: { query: T; headers: { [key: string]: string } },
  res: Response,
  schema: Joi.ObjectSchema,
): { isValid: boolean; connectionId?: string } => {
  const connectionId =
    req.headers["UCW-Connection-Id"] || req.headers["ucw-connection-id"];

  const { error } = schema.validate({
    ...req.query,
    connectionId,
  });

  if (error) {
    res.status(400);
    res.json(he.encode(error.details[0].message));
    return { isValid: false };
  }

  return { isValid: true, connectionId };
};

export interface AccountsParams extends Record<string, unknown> {
  aggregator: Aggregator;
  userId: string;
}

export interface IdentityParams extends Record<string, unknown> {
  aggregator: Aggregator;
  userId: string;
}

export interface TransactionsParams extends Record<string, unknown> {
  accountId: string;
  aggregator: Aggregator;
  userId: string;
  startDate?: string;
  endDate?: string;
}

const AccountsParamsSchema = Joi.object({
  aggregator: Joi.string().required(),
  userId: Joi.when("aggregator", {
    is: Joi.string().valid(...userlessAggregatorIds),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),
  connectionId: Joi.string().required().messages({
    "any.required": connectionIdHeaderRequiredMessage,
  }),
});

export const createAccountsDataHandler = (isVc: boolean) =>
  withValidateAggregatorInQueryParams(
    async (
      req: { query: AccountsParams; headers: { [key: string]: string } },
      res: Response,
    ) => {
      const { aggregator, userId } = req.query;

      const validation = validateRequestAndConnectionId(
        req,
        res,
        AccountsParamsSchema,
      );
      if (!validation.isValid) {
        return;
      }

      try {
        const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
        const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
          userId,
          true,
        );

        const dataArgs = {
          aggregator,
          connectionId: validation.connectionId,
          type: VCDataTypes.ACCOUNTS,
          userId: aggregatorUserId,
        };

        if (isVc) {
          const vc = await getVC(dataArgs);
          res.json({
            jwt: vc,
          });
        } else {
          const data = await getData(dataArgs);

          res.json(data);
        }
      } catch (error) {
        logger.error("createAccountsDataHandler error", error);

        handleError({ error, res });
      }
    },
  );

const IdentityParamsSchema = Joi.object({
  aggregator: Joi.string().required(),
  userId: Joi.when("aggregator", {
    is: Joi.string().valid(...userlessAggregatorIds),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),
  connectionId: Joi.string().required().messages({
    "any.required": connectionIdHeaderRequiredMessage,
  }),
});

export const createIdentityDataHandler = (isVc: boolean) =>
  withValidateAggregatorInQueryParams(
    async (
      req: { query: IdentityParams; headers: { [key: string]: string } },
      res: Response,
    ) => {
      const { aggregator, userId } = req.query;

      const validation = validateRequestAndConnectionId(
        req,
        res,
        IdentityParamsSchema,
      );
      if (!validation.isValid) {
        return;
      }

      try {
        const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
        const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
          userId,
          true,
        );

        const dataArgs = {
          aggregator,
          connectionId: validation.connectionId,
          type: VCDataTypes.IDENTITY,
          userId: aggregatorUserId,
        };

        if (isVc) {
          const vc = await getVC(dataArgs);
          res.json({
            jwt: vc,
          });
        } else {
          const data = await getData(dataArgs);
          res.json(data);
        }
      } catch (error) {
        logger.error("createIdentityDataHandler error", error);

        handleError({ error, res });
      }
    },
  );

const transactionsParamsSchema = Joi.object({
  accountId: Joi.string().required(),
  aggregator: Joi.string().required(),
  userId: Joi.when("aggregator", {
    is: Joi.string().valid(...userlessAggregatorIds),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),
  connectionId: Joi.string().optional(),
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
});

export const createTransactionsDataHandler = (isVc: boolean) =>
  withValidateAggregatorInQueryParams(
    async (
      req: { query: TransactionsParams; headers: { [key: string]: string } },
      res: Response,
    ) => {
      const { accountId, aggregator, userId, startDate, endDate } = req.query;

      const validation = validateRequestAndConnectionId(
        req,
        res,
        transactionsParamsSchema,
      );
      if (!validation.isValid) {
        return;
      }

      try {
        const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
        const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
          userId,
          true,
        );

        const dataArgs = {
          aggregator,
          type: VCDataTypes.TRANSACTIONS,
          userId: aggregatorUserId,
          accountId,
          connectionId: validation.connectionId,
          startDate,
          endDate,
        };

        if (isVc) {
          const vc = await getVC(dataArgs);
          res.json({
            jwt: vc,
          });
        } else {
          const data = await getData(dataArgs);
          res.json(data);
        }
      } catch (error) {
        logger.error("createTransactionsDataHandler error", error);

        handleError({ error, res });
      }
    },
  );
