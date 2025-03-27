import { type Request } from "express";
import { createAggregatorWidgetAdapter } from "../adapterIndex";

export const getAggregatorWidgetAdapter = (req: Request) => {
  return createAggregatorWidgetAdapter({
    aggregator: req.context.aggregator,
    sessionId: req.context.sessionId,
  });
};
