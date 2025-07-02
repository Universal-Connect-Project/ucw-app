import { ComboJobTypes } from "@repo/utils";
import type { Request, Response } from "express";
import Joi from "joi";
import { aggregators, nonTestAggregators } from "./adapterSetup";
import fs from "node:fs";

import he from "he";
import path from "path";

export const widgetHandler = (req: Request, res: Response) => {
  const schema = Joi.object({
    connectionId: Joi.string(),
    institutionId: Joi.string(),
    jobTypes: Joi.string()
      .custom((value, helpers) => {
        const items = value.split(",") as ComboJobTypes[];
        const invalidItems = items.filter(
          (item) => !Object.values(ComboJobTypes).includes(item),
        );
        if (invalidItems.length > 0) {
          return helpers.error("any.invalid", { invalid: invalidItems });
        }
        return value;
      })
      .required(),
    aggregator: Joi.string().valid(...aggregators),
    singleAccountSelect: Joi.bool(),
    userId: Joi.string().required(),
    token: Joi.string(),
    aggregatorOverride: Joi.string().valid(...nonTestAggregators),
  })
    .with("aggregator", ["institutionId", "connectionId"])
    .with("connectionId", ["institutionId", "aggregator"]);

  const { error } = schema.validate(req.query);

  if (error) {
    res.status(400);
    res.send(he.encode(error.details[0].message));

    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).metricsPath = "/catchall";

  const html = fs.readFileSync(
    path.join(__dirname, "../../ui/dist/index.html"),
    "utf8",
  );
  res.send(html);
};
