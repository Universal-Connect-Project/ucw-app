import type { Response } from "express";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { withValidateAggregatorInPath } from "../utils/validators";
import type { Aggregator } from "../adapterSetup";

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
      const aggregatorAdapter = createAggregatorWidgetAdapter(aggregator);
      const failIfUserNotFound = true;
      const aggregatorUserId = await aggregatorAdapter.ResolveUserId(
        userId,
        failIfUserNotFound,
      );
      const ret = await aggregatorAdapter.DeleteUser(aggregatorUserId);
      res.status(ret.status);
      res.send(ret.data);
    } catch (error) {
      res.status(400);
      res.send("User delete failed");
    }
  },
);
