import type { Response } from "express";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { withValidateAggregatorInPath } from "../utils/validators";
import type { Aggregator } from "../adapterSetup";
import handleError from "../utils/errorHandler";

interface UserDeleteParameters {
  aggregator: Aggregator;
  userId: string;
}

export interface UserDeleteRequest {
  params: UserDeleteParameters;
}

export const userDeleteHandler = withValidateAggregatorInPath(
  async (req: UserDeleteRequest, res: Response) => {
    const { userId, aggregator } = req.params;

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

interface ConnectionDeleteParameters {
  aggregator: Aggregator;
  userId: string;
  connectionId: string;
}

export interface ConnectionDeleteRequest {
  params: ConnectionDeleteParameters;
}

export const userConnectionDeleteHandler = withValidateAggregatorInPath(
  async (req: ConnectionDeleteRequest, res: Response) => {
    const { connectionId, aggregator, userId } = req.params;

    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
      const resolvedUserId = await aggregatorAdapter.ResolveUserId(userId);
      const ret = await aggregatorAdapter.DeleteConnection(
        connectionId,
        resolvedUserId,
      );
      res.status(ret.status);
      res.send(ret.data);
    } catch (error) {
      handleError({ error, res });
    }
  },
);
