import type { JobTypes } from "@repo/utils";
import { mapJobType } from "../utils";
import type { Request, Response } from "express";

export const instrumentationHandler = async (req: Request, res: Response) => {
  try {
    const { jobType, userId } = req.params;

    const { body } = req;

    const { current_aggregator, current_member_guid, single_account_select } =
      body;

    req.context.user_id = userId;

    if (Boolean(current_member_guid) && Boolean(current_aggregator)) {
      req.context.aggregator = current_aggregator;
      req.context.connection_id = current_member_guid;
    }

    req.context.job_type = mapJobType(jobType as JobTypes);
    req.context.scheme = "vcs";
    req.context.oauth_referral_source = "BROWSER";
    req.context.single_account_select = single_account_select;
    req.context.updated = true;

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
};
