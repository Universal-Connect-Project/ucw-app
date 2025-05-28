/* eslint-disable @typescript-eslint/naming-convention */
import type { Response } from "express";
import * as logger from "../infra/logger";
import he from "he";
import Joi from "joi";

import { VCDataTypes } from "@repo/utils";
import type { Aggregator } from "../shared/contract";
import { withValidateAggregatorInPath } from "../utils/validators";
import { createAggregatorWidgetAdapter, getData, getVC } from "../adapterIndex";
import handleError from "../utils/errorHandler";

export interface AccountsDataQueryParameters {
  connectionId: string;
  aggregator: Aggregator;
  userId: string;
}

export interface AccountsRequest {
  params: AccountsDataQueryParameters;
}

export interface IdentityRequest {
  params: IdentityDataParameters;
}

export interface TransactionsRequest {
  query: TransactionsDataQueryParameters;
  params: TransactionsDataPathParameters;
}

export const createAccountsDataHandler = (isVc: boolean) =>
  withValidateAggregatorInPath(async (req: AccountsRequest, res: Response) => {
    const { aggregator, connectionId, userId } = req.params;

    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
      const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
        userId,
        true,
      );

      const dataArgs = {
        aggregator,
        connectionId,
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
  });

export interface IdentityDataParameters {
  connectionId: string;
  aggregator: Aggregator;
  userId: string;
}

export const createIdentityDataHandler = (isVc: boolean) =>
  withValidateAggregatorInPath(async (req: IdentityRequest, res: Response) => {
    const { aggregator, connectionId, userId } = req.params;

    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
      const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
        userId,
        true,
      );

      const dataArgs = {
        aggregator,
        connectionId,
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
  });

export interface TransactionsDataQueryParameters {
  endDate?: string;
  startDate?: string;
  start_time?: string;
  end_time?: string;
  connectionId?: string;
}

export interface TransactionsDataPathParameters {
  accountId: string;
  aggregator: Aggregator;
  userId: string;
}

const transactionsQuerySchema = Joi.object({
  end_time: Joi.string(),
  start_time: Joi.string(),
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
});

export const createTransactionsDataHandler = (isVc: boolean) =>
  withValidateAggregatorInPath(
    async (req: TransactionsRequest, res: Response) => {
      const { accountId, aggregator, userId } = req.params;
      const { startDate, endDate, connectionId, start_time, end_time } =
        req.query;

      const { error } = transactionsQuerySchema.validate(req.query);
      if (error) {
        res.status(400);
        res.json(he.encode(error.details[0].message));
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
          connectionId: connectionId,
          startDate: startDate || start_time,
          endDate: endDate || end_time,
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
