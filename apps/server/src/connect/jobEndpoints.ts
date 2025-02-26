import type { Request, Response } from "express";
import { WidgetJobTypes } from "@repo/utils";
import type { ConnectApi } from "./connectApi";

export interface JobsRequest extends Request {
  connectApi: ConnectApi;
}

export const jobsRouteHandler = async (req: JobsRequest, res: Response) => {
  res.send({
    guid: req.params.member_guid,
    job_type: WidgetJobTypes.COMBINATION,
  });
};
