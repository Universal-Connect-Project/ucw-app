import type { Request, Response } from "express";
import { del, get } from "../services/storageClient/redis";

export const instrumentationHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { body } = req;

    const {
      current_aggregator,
      jobTypes,
      singleAccountSelect,
      aggregatorOverride,
      connectionToken,
    } = body;

    req.context.userId = userId;

    if (Boolean(connectionToken) && Boolean(current_aggregator)) {
      const redisKey = `connection-${connectionToken}`;
      const storedConnectionId = await get(redisKey);
      if (storedConnectionId) {
        await del(redisKey); // one time use
        req.context.connectionId = storedConnectionId;
        req.context.aggregator = current_aggregator;
        res.json({ connectionId: storedConnectionId });
      } else {
        throw new Error("Invalid or expired connectionToken");
      }
    }
    if (aggregatorOverride) {
      req.context.aggregatorOverride = aggregatorOverride;
    }

    req.context.jobTypes = jobTypes;
    req.context.scheme = "vcs";
    req.context.oauth_referral_source = "BROWSER";
    req.context.singleAccountSelect = singleAccountSelect;

    res.sendStatus(200);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
