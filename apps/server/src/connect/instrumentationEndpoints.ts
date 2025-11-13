import type { Request, Response } from "express";
import { del, get } from "../services/storageClient/redis";

export const instrumentationHandler = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const widgetParams = await get(`token-${token}`);

    const {
      jobTypes,
      singleAccountSelect,
      aggregatorOverride,
      userId,
      aggregator,
      connectionId,
    } = widgetParams;

    req.context.userId = userId;
    req.context.jobTypes = jobTypes;
    req.context.scheme = "vcs";
    req.context.oauth_referral_source = "BROWSER";
    req.context.singleAccountSelect = singleAccountSelect !== "false";
    if (Boolean(aggregator) && Boolean(connectionId)) {
      req.context.aggregator = aggregator;
      req.context.connectionId = connectionId;
    }

    await del(`token-${token}`); // one time use

    if (aggregatorOverride) {
      req.context.aggregatorOverride = aggregatorOverride;
    }

    res.status(200).json({ ...widgetParams });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
