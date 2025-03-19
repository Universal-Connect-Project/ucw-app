import type { Response, Request } from "express";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { ConnectionStatus } from "../shared/contract";
import * as path from "path";
import * as fs from "fs";
import * as logger from "../infra/logger";

//GET '/oauth/:aggregator/redirect_from/'
export const oauthRedirectHandler = async (req: Request, res: Response) => {
  const { aggregator } = req.params;
  try {
    const aggregatorAdapter = createAggregatorWidgetAdapter({ aggregator });
    const oauthResponse = await aggregatorAdapter?.HandleOauthResponse({
      query: req.query,
      params: req.params,
      body: req.body,
    });

    const filePath = path.join(__dirname, `../infra/http/oauth/oauth.html`);
    let html: string = fs.readFileSync(filePath, "utf8");

    const isError = oauthResponse?.status !== ConnectionStatus.CONNECTED;

    const oAuthText = isError
      ? {
          message: "Something went wrong",
          title: "OAuth Error",
        }
      : {
          message: "Thank you for completing OAuth",
          title: "OAuth Complete",
        };

    html = html.replace("{{message}}", oAuthText.message);
    html = html.replace("{{title}}", oAuthText.title);

    res.send(html);
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
