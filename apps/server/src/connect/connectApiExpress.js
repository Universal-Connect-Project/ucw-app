import * as path from "path";
import { instrumentation } from "../adapters";
import config from "../config";
import { contextHandler } from "../infra/context.ts";
import { ApiEndpoints } from "../shared/connect/ApiEndpoint";
import { ConnectApi } from "./connectApi";
import {
  accountsDataHandler,
  identityDataHandler,
  transactionsDataHandler,
} from "./dataEndpoints";
import {
  favoriteInstitutionsHandler,
  getInstitutionCredentialsHandler,
  getInstitutionHandler,
  getInstitutionsHandler,
} from "./institutionEndpoints";
import { userDeleteHandler } from "./userEndpoints";
import { MappedJobTypes } from "../shared/contract";
import stubs from "./instrumentations.js";
import { jobsRouteHandler } from "./jobEndpoints";

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
      if (!req.context.resolved_user_id) {
        req.context.resolved_user_id = await req.connectApi.ResolveUserId(
          req.context.user_id,
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
      config.Env !== "test" &&
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

  app.post(ApiEndpoints.MEMBERS, async (req, res) => {
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
  app.get(
    `${ApiEndpoints.MEMBERS}/:member_guid/oauth_window_uri`,
    async (req, res) => {
      const ret = await req.connectApi.getOauthWindowUri(
        req.params.member_guid,
      );
      res.send({ oauth_window_uri: ret });
    },
  );
  app.delete(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    res.sendFile(path.join(__dirname, "/stubs/member.json"));
  });
  app.get(
    `${ApiEndpoints.INSTITUTIONS}/:institution_guid/credentials`,
    getInstitutionCredentialsHandler,
  );

  app.get(`${ApiEndpoints.INSTITUTIONS}/favorite`, favoriteInstitutionsHandler);

  app.get(
    `${ApiEndpoints.INSTITUTIONS}/:institution_guid`,
    getInstitutionHandler,
  );
  app.get(ApiEndpoints.INSTITUTIONS, getInstitutionsHandler);
  app.get(`${ApiEndpoints.JOBS}/:member_guid`, jobsRouteHandler);

  app.get("/oauth_states", async (req, res) => {
    const ret = await req.connectApi.getOauthStates(
      req.query.outbound_member_guid,
    );
    res.send(ret);
  });

  app.get("/oauth_states/:guid", async (req, res) => {
    const ret = await req.connectApi.getOauthState(req.params.guid);
    res.send(ret);
  });

  app.get(ApiEndpoints.MEMBERS, async (req, res) => {
    const ret = await req.connectApi.loadMembers();
    res.send({
      members: ret,
    });
  });

  app.post(
    `${ApiEndpoints.MEMBERS}/:member_guid/identify`,
    async (req, res) => {
      const ret = await req.connectApi.updateConnection(
        { id: req.params.member_guid, job_type: "aggregate_identity" },
        req.context.resolved_user_id,
      );
      res.send({
        members: ret,
      });
    },
  );

  app.post(`${ApiEndpoints.MEMBERS}/:member_guid/verify`, async (req, res) => {
    const ret = await req.connectApi.updateConnection(
      { id: req.params.member_guid, job_type: MappedJobTypes.VERIFICATION },
      req.context.resolved_user_id,
    );
    res.send({
      members: ret,
    });
  });

  app.post(`${ApiEndpoints.MEMBERS}/:member_guid/history`, async (req, res) => {
    const ret = await req.connectApi.updateConnection(
      { id: req.params.member_guid, job_type: "aggregate_extendedhistory" },
      req.context.resolved_user_id,
    );
    res.send({
      members: ret,
    });
  });

  app.post(ApiEndpoints.INSTRUMENTATION, async (req, res) => {
    if (await instrumentation(req.context, req.body.instrumentation)) {
      res.sendStatus(200);
      return;
    }
    res.sendStatus(400);
  });

  app.post("/members/:member_guid/unthrottled_aggregate", async (req, res) => {
    const ret = await req.connectApi.updateConnection(
      { id: req.params.member_guid, job_type: "aggregate" },
      req.context.resolved_user_id,
    );
    res.send({
      members: ret,
    });
  });

  app.delete("/api/aggregator/:aggregator/user/:userId", userDeleteHandler);

  // VC Data Endpoints
  app.get(
    "/data/aggregator/:aggregator/user/:userId/connection/:connectionId/accounts",
    accountsDataHandler,
  );
  app.get(
    "/data/aggregator/:aggregator/user/:userId/connection/:connectionId/identity",
    identityDataHandler,
  );
  app.get(
    "/data/aggregator/:aggregator/user/:userId/account/:accountId/transactions",
    transactionsDataHandler,
  );
}
