import { mapJobType } from "../utils";
import type { Request, Response } from "express";

export const instrumentationHandler = async (req: Request, res: Response) => {
  try {
    const { body } = req;

    const {
      current_aggregator,
      current_member_guid,
      job_type,
      single_account_select,
      user_id,
    } = body;

    if (!user_id) {
      throw new Error();
    }

    req.context.user_id = user_id;

    if (Boolean(current_member_guid) && Boolean(current_aggregator)) {
      req.context.aggregator = current_aggregator;
      req.context.connection_id = current_member_guid;
    }

    req.context.job_type = mapJobType(job_type);
    req.context.scheme = "vcs";
    req.context.oauth_referral_source = "BROWSER";
    req.context.single_account_select = single_account_select;
    req.context.updated = true;

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
};
