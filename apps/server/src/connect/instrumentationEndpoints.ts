import type { Request, Response } from "express";

export const instrumentationHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { body } = req;

    const {
      current_aggregator,
      current_member_guid,
      jobTypes,
      sessionId,
      singleAccountSelect,
    } = body;

    req.context.userId = userId;

    if (Boolean(current_member_guid) && Boolean(current_aggregator)) {
      req.context.aggregator = current_aggregator;
      req.context.connectionId = current_member_guid;
    }

    req.context.sessionId = sessionId;
    req.context.jobTypes = jobTypes;
    req.context.scheme = "vcs";
    req.context.oauth_referral_source = "BROWSER";
    req.context.singleAccountSelect = singleAccountSelect;

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
};
