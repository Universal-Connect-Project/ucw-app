import type { Response, Request } from "express";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { get } from "../services/storageClient/redis";
import { ConnectionStatus } from "../shared/contract";
import * as path from "path";
import * as fs from "fs";
import * as logger from "../infra/logger";

//GET '/oauth/:aggregator/redirect_from/'
export const oauthRedirectHandler = async (req: Request, res: Response) => {
  const { aggregator } = req.params;
  try {
    const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
    const oauth_res: any =
      (await aggregatorAdapter?.HandleOauthResponse({
        query: req.query,
        params: req.params,
        body: req.body,
      })) || {};
    const queries: any = {};
    if (oauth_res.id) {
      const context = await get(
        `context_${oauth_res.request_id || oauth_res.id}`,
      );
      oauth_res.scheme = context?.scheme;
      oauth_res.oauth_referral_source = context?.oauth_referral_source;
      oauth_res.sessionId = context?.sessionId;
      oauth_res.userId = context?.userId;

      const metadata = JSON.stringify({
        aggregator,
        id: oauth_res.id,
        member_guid: oauth_res.id,
        user_guid: oauth_res.userId,
        error_reason: oauth_res.error,
        session_guid: oauth_res.sessionId,
      });

      queries.status =
        oauth_res.status === ConnectionStatus.CONNECTED ? "success" : "error";
      queries.app_url = `${oauth_res.scheme}://oauth_complete?metadata=${encodeURIComponent(metadata)}`;
      queries.redirect =
        oauth_res.oauth_referral_source?.toLowerCase() === "browser"
          ? `false`
          : "true";
      queries.error_reason = oauth_res.error;
      queries.member_guid = oauth_res.id;
    }

    const oauthParams = new RegExp(
      Object.keys(queries)
        .map((r) => `\\$${r}`)
        .join("|"),
      "g",
    );
    const htmlFile = oauth_res?.error ? "error" : "success";
    const filePath = path.join(
      __dirname,
      `../infra/http/oauth/${htmlFile}.html`,
    );
    const html: string = await new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, content) => {
        if (err) {
          reject(err);
        }
        resolve(content);
      });
    });
    res.send(
      html.replaceAll(oauthParams, (q) => queries[q.substring(1)] || ""),
    );
  } catch (error) {
    logger.error("Oauth redirect error", error);
    res.status(400);
    res.send("Error");
  }
};

//ALL '/webhook/:aggregator/*'
export const webhookHandler = async (req: Request, res: Response) => {
  const { aggregator } = req.params;

  try {
    const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
    logger.info(`received web hook at: ${req.path}`, req.query);
    const ret = await aggregatorAdapter?.HandleOauthResponse({
      query: req.query,
      params: req.params,
      body: req.body,
    });
    res.send(ret);
  } catch (error) {
    logger.error("Oauth redirect error", error);
    res.status(400);
    res.send("Error");
  }
};
