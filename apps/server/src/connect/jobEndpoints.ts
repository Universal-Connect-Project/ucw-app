import type { Request, Response } from "express";
import { WidgetJobTypes } from "@repo/utils";
import { ConnectApi } from "./connectApi";

export interface JobsRequest extends Request {
  connectApi: ConnectApi;
}

export const jobsRouteHandler = async (req: JobsRequest, res: Response) => {
  if (["mx_int", "mx"].includes(req.context.aggregator)) {
    if (req.params.member_guid === "null") {
      res.send({ job: { guid: "none", job_type: WidgetJobTypes.AGGREGATION } });
      return;
    }
    const ret = await req.connectApi.loadMemberByGuid(req.params.member_guid);
    res.send(ret);
  } else {
    res.send({
      job: {
        guid: req.params.member_guid,
        job_type: WidgetJobTypes.AGGREGATION,
      },
    });
  }
};
