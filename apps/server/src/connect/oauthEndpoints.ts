import type { Response, Request } from "express";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { get, set } from "../services/storageClient/redis";
import { ConnectionStatus } from "../shared/contract";
import * as path from 'path'
import * as fs from 'fs'
import config from "../config";
import * as logger from "../infra/logger";

//GET '/oauth/:aggregator/redirect_from/'
export const oauthRedirectHandler = 
  async (req: Request, res: Response) => {
    const { userId, aggregator } = req.params;
    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter(aggregator);
      const oauth_res = await aggregatorAdapter.HandleOauthResponse({...req.query, ...req.params, ...req.body})
      const ret = {
        ...oauth_res,
        aggregator
      } as any
      if(ret.id){
        const context = await get(`context_${ret.request_id || ret.id}`);
        ret.scheme = context.scheme,
        ret.oauth_referral_source = context.oauth_referral_source;
        ret.session_id = context.session_id;
        ret.user_id = context.user_id
      }
      const metadata = JSON.stringify({
        aggregator, 
        id: ret.id, 
        member_guid: ret.id, 
        user_guid: ret.user_id,
        error_reason: ret.error, 
        session_guid: ret.session_id,
      });
      const app_url = `${ret?.scheme}://oauth_complete?metadata=${encodeURIComponent(metadata)}`
      const queries = {
        status: ret?.status === ConnectionStatus.CONNECTED ? 'success': 'error',
        app_url,
        redirect: ret?.oauth_referral_source?.toLowerCase() === 'browser' ? `false`: 'true',
        error_reason: ret?.error,
        member_guid: ret?.id,
      };
      
      const oauthParams =  new RegExp(Object.keys(queries).map(r => `\\$${r}`).join('|'), 'g');
      function mapOauthParams(queries: any, res: Response, html: string){
        res.send(html.replaceAll(oauthParams, q => queries[q.substring(1)] || ''));
        // res.send(queries)
      }
      const htmlFile = ret?.error ? 'error' : 'success'
      const filePath = path.join(__dirname, `../infra/http/oauth/${htmlFile}.html`)
      const html: string = await new Promise((resolve, reject) => {
        fs.readFile(
          filePath, 
          'utf8', 
          (err, content) => {
            if(err){
              reject(err);
            }
            resolve(content);
          }
        );
      }) 
      mapOauthParams(queries, res, html);
    } catch (error) {
      logger.error('Oauth redirect error', error)
      res.status(400);
      res.send("Error");
    }
  }

//ALL '/webhook/:aggregator/*'
export const webhookHandler = 
  async (req: Request, res: Response) => {
    const { aggregator } = req.params;

    try {
      const aggregatorAdapter = createAggregatorWidgetAdapter(aggregator);
      logger.info(`received web hook at: ${req.path}`, req.query)
      //console.log(req.body)
      const ret = await aggregatorAdapter.HandleOauthResponse({...req.query, ...req.params, ...req.body})
      res.send(ret);
    } catch (error) {
      logger.error('Oauth redirect error', error)
      res.status(400);
      res.send("Error");
    }
  }
