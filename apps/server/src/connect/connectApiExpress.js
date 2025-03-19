import * as path from "path";
import config from "../config";
import { contextHandler } from "../infra/context.ts";
import { ApiEndpoints } from "../shared/connect/ApiEndpoint";
import { ConnectApi } from "./connectApi";
import {
  recommendedInstitutionsHandler,
  getInstitutionCredentialsHandler,
  getInstitutionHandler,
  getInstitutionsHandler,
} from "./institutionEndpoints";
import { webhookHandler, oauthRedirectHandler } from "./oauthEndpoints";
import stubs from "./instrumentations.js";
import { jobsRouteHandler } from "./jobEndpoints";
import { instrumentationHandler } from "./instrumentationEndpoints";
import {
  INSTRUMENTATION_URL,
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
  MEMBERS_URL,
  OAUTH_STATES_URL,
} from "@repo/utils";

const disableAnalytics = true;

export default function (app) {
  stubs(app);
  app.use(contextHandler);
  app.use(async (req, res, next) => {
    if (
      req.path === "/" ||
      req.path.startsWith("/example") === true ||
      req.path.startsWith("/static") === true
    ) {
      return next();
    }
    req.connectApi = new ConnectApi(req);
    if ((await req.connectApi.init()) != null) {
      if (!req.context.resolvedUserId) {
        req.context.resolvedUserId = await req.connectApi.ResolveUserId(
          req.context.userId,
        );
      }
    }
    next();
  });

  app.get("/oauth_redirect", (req, res) => {
    res.sendFile(path.join(__dirname, "../infra/http/oauth.html"));
  });

  app.post("/analytics*", async (req, res) => {
    if (disableAnalytics) {
      res.sendStatus(200);
      return;
    }

    if (
      config.ENV !== "test" &&
      config.AnalyticsServiceEndpoint !== "" &&
      config.AnalyticsServiceEndpoint != null
    ) {
      const ret = await req.connectApi.analytics(req.path, req.body);
      res.send(ret);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      res.send(require("./stubs/analytics_sessions.js"));
    }
  });

  app.post(MEMBERS_URL, async (req, res) => {
    const ret = await req.connectApi.addMember(req.body);
    res.send(ret);
  });
  app.put(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    const ret = await req.connectApi.updateMember(req.body);
    res.send(ret);
  });
  app.get(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    const ret = await req.connectApi.loadMemberByGuid(req.params.member_guid);
    res.send(ret);
  });
  app.get(
    `${ApiEndpoints.MEMBERS}/:member_guid/credentials`,
    async (req, res) => {
      const ret = await req.connectApi.getMemberCredentials(
        req.params.member_guid,
      );
      res.send(ret);
    },
  );
  app.delete(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    res.sendFile(path.join(__dirname, "/stubs/member.json"));
  });
  app.get(
    `${ApiEndpoints.INSTITUTIONS}/:institution_guid/credentials`,
    getInstitutionCredentialsHandler,
  );

  app.get(RECOMMENDED_INSTITUTIONS_URL, recommendedInstitutionsHandler);

  app.get(
    `${ApiEndpoints.INSTITUTIONS}/:institution_guid`,
    getInstitutionHandler,
  );
  app.get(SEARCH_INSTITUTIONS_URL, getInstitutionsHandler);
  app.get(`${ApiEndpoints.JOBS}/:member_guid`, jobsRouteHandler);

  app.get(OAUTH_STATES_URL, async (req, res) => {
    const ret = await req.connectApi.getOauthStates(
      req.query.outboundMemberGuid,
    );
    res.send(ret);
  });

  app.get(`${OAUTH_STATES_URL}/:guid`, async (req, res) => {
    const ret = await req.connectApi.getOauthState(req.params.guid);
    res.send(ret);
  });

  app.get(MEMBERS_URL, async (req, res) => {
    const ret = await req.connectApi.loadMembers();
    res.send(ret);
  });

  app.post(`${INSTRUMENTATION_URL}/userId/:userId`, instrumentationHandler);

  app.all("/webhook/:aggregator/*", webhookHandler);

  app.get("/oauth/:aggregator/redirect_from/", oauthRedirectHandler);

  app.get("/oauth/oauth.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../infra/http/oauth/oauth.js"));
  });
}
