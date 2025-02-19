import { JobTypes } from "@repo/utils";
import type { Request, Response } from "express";
import Joi from "joi";
import { aggregators } from "./adapterSetup";
import fs from "node:fs";

import he from "he";
import path from "path";

const pageQueryParameters = new RegExp(
  [
    "institution_id",
    "job_type",
    "scheme",
    "user_id",
    "client_guid",
    "connection_id",
    "aggregator",
    "partner",
    "oauth_referral_source",
    "single_account_select",
    "update_credentials",
    "server",
    "is_mobile_webview",
    "include_identity",
    "session_id"
  ]
    .map((r) => `\\$${r}`)
    .join("|"),
  "g",
);

function renderDefaultPage(req: Request, res: Response, html: string) {
  if (
    req.query.connection_id != null &&
    (req.query.aggregator == null || req.query.aggregator === "")
  ) {
    delete req.query.connection_id;
  }
  res.send(
    html.replaceAll(pageQueryParameters, (q: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      encodeURIComponent((req.query as any)[q.substring(1)] ?? ""),
    ),
  );
}

export const widgetHandler = (req: Request, res: Response) => {
  const schema = Joi.object({
    connection_id: Joi.string(),
    institution_id: Joi.string(),
    job_type: Joi.string()
      .valid(...Object.values(JobTypes))
      .required(),
    aggregator: Joi.string().valid(...aggregators),
    single_account_select: Joi.bool(),
    user_id: Joi.string().required(),
    token: Joi.string(),
  }).and("connection_id", "aggregator");

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

  renderDefaultPage(req, res, html);
};
