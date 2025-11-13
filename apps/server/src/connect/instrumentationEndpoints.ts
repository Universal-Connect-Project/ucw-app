import type { Request, Response } from "express";
import { del, get } from "../services/storageClient/redis";

export const instrumentationHandler = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const widgetParams = await get(`token-${token}`);

    const { jobTypes, singleAccountSelect, aggregatorOverride, userId } =
      widgetParams;

    req.context.userId = userId;
    req.context.jobTypes = jobTypes;
    req.context.scheme = "vcs";
    req.context.oauth_referral_source = "BROWSER";
    req.context.singleAccountSelect = singleAccountSelect !== "false";

    await del(`token-${token}`); // one time use

    if (aggregatorOverride) {
      req.context.aggregatorOverride = aggregatorOverride;
    }

    res.status(200).json({ ...widgetParams });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
