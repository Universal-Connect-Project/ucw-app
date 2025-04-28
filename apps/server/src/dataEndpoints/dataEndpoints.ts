/* eslint-disable @typescript-eslint/naming-convention */
import type { Response } from "express";
import * as logger from "../infra/logger";
import he from "he";

import {
  SOMETHING_WENT_WRONG_ERROR_TEXT,
  USER_NOT_RESOLVED_ERROR_TEXT,
  VCDataTypes,
} from "@repo/utils";
import type { Aggregator } from "../shared/contract";
import { withValidateAggregatorInPath } from "../utils/validators";
import { createAggregatorWidgetAdapter, getData, getVC } from "../adapterIndex";

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
        res.send({
          jwt: vc,
        });
      } else {
        const data = await getData(dataArgs);

        res.json(data);
      }
    } catch (error) {
      logger.error("createAccountsDataHandler error", error);

      if (error.message === USER_NOT_RESOLVED_ERROR_TEXT) {
        res.status(404);
        res.send(USER_NOT_RESOLVED_ERROR_TEXT);
      } else {
        res.status(400);
        res.send(SOMETHING_WENT_WRONG_ERROR_TEXT);
      }
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
        res.send({
          jwt: vc,
        });
      } else {
        const data = await getData(dataArgs);
        res.json(data);
      }
    } catch (error) {
      logger.error("createIdentityDataHandler error", error);

      if (error.message === USER_NOT_RESOLVED_ERROR_TEXT) {
        res.status(404);
        res.send(USER_NOT_RESOLVED_ERROR_TEXT);
      } else {
        res.status(400);
        res.send(SOMETHING_WENT_WRONG_ERROR_TEXT);
      }
    }
  });

export interface TransactionsDataQueryParameters {
  end_time: string;
  start_time: string;
  connectionId?: string;
}

export interface TransactionsDataPathParameters {
  accountId: string;
  aggregator: Aggregator;
  userId: string;
}

export const createTransactionsDataHandler = (isVc: boolean) =>
  withValidateAggregatorInPath(
    async (req: TransactionsRequest, res: Response) => {
      const { accountId, aggregator, userId } = req.params;
      const { start_time, end_time, connectionId } = req.query;

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
          startTime: start_time,
          endTime: end_time,
        };

        let validationError: string | undefined;

        if (
          typeof aggregatorAdapter?.DataRequestValidators?.transactions ===
          "function"
        ) {
          validationError =
            aggregatorAdapter.DataRequestValidators?.transactions(req);
        }

        if (validationError) {
          res.status(400);
          res.send(he.encode(validationError));
          return;
        }

        if (isVc) {
          const vc = await getVC(dataArgs);
          res.send({
            jwt: vc,
          });
        } else {
          const data = await getData(dataArgs);
          res.json(data);
        }
      } catch (error) {
        logger.error("createTransactionsDataHandler error", error);

        if (error.message === USER_NOT_RESOLVED_ERROR_TEXT) {
          res.status(404).json({
            message: USER_NOT_RESOLVED_ERROR_TEXT,
          });
          res.send(USER_NOT_RESOLVED_ERROR_TEXT);
        } else if (error?.cause?.statusCode || error?.message) {
          res.status(error?.cause?.statusCode || 400).json({
            message: error.message,
          });
        } else {
          res.status(400).json({
            message: SOMETHING_WENT_WRONG_ERROR_TEXT,
          });
        }
      }
    },
  );
