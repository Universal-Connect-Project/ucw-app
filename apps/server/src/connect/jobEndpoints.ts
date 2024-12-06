import type { Request, Response } from "express";
import { WidgetJobTypes } from "@repo/utils";
import { ConnectApi } from "./connectApi";

export interface JobsRequest extends Request {
  connectApi: ConnectApi;
}

export const jobsRouteHandler = async (req: JobsRequest, res: Response) => {
  if (
    typeof req.connectApi.aggregatorAdapter?.RouteHandlers
      ?.jobRequestHandler === "function"
  ) {
    req.connectApi.aggregatorAdapter.RouteHandlers.jobRequestHandler(req, res);
  } else {
    res.send({
      job: {
        guid: req.params.member_guid,
        job_type: WidgetJobTypes.AGGREGATION,
      },
    });
  }
};
