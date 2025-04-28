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

interface CustomError extends Error {
  cause: {
    statusCode?: number;
  };
}

const parseError = (
  error: CustomError,
): { statusCode: number; message: string } => {
  if (error.message === USER_NOT_RESOLVED_ERROR_TEXT) {
    return {
      statusCode: 404,
      message: USER_NOT_RESOLVED_ERROR_TEXT,
    };
  } else if (error.message) {
    return {
      statusCode: error.cause?.statusCode || 400,
      message: error.message,
    };
  } else {
    return {
      statusCode: 400,
      message: SOMETHING_WENT_WRONG_ERROR_TEXT,
    };
  }
};

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

      const parsedError = parseError(error);

      res.status(parsedError.statusCode).json({
        message: parsedError.message,
      });
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

      const parsedError = parseError(error);

      res.status(parsedError.statusCode).json({
        message: parsedError.message,
      });
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

        const parsedError = parseError(error);

        res.status(parsedError.statusCode).json({
          message: parsedError.message,
        });
      }
    },
  );
