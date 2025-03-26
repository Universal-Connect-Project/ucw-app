import * as path from "path";
import { contextHandler } from "../infra/context.ts";
import { ApiEndpoints } from "../shared/connect/ApiEndpoint";
import { ConnectApi } from "./connectApi";
import stubs from "./instrumentations.js";
import { jobsRouteHandler } from "./jobEndpoints";
import { instrumentationHandler } from "./instrumentationEndpoints";
import {
  INSTRUMENTATION_URL,
  MEMBERS_URL,
  OAUTH_STATES_URL,
} from "@repo/utils";

export default function (app) {
  stubs(app);
  app.use(contextHandler);
  app.use(async (req, res, next) => {
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

  app.post(MEMBERS_URL, async (req, res) => {
    const ret = await req.connectApi.addMember({
      aggregatorId: req.context.aggregatorId,
      jobTypes: req.context.jobTypes,
      memberData: req.body,
      ucpInstitutionId: req.context.ucpInstitutionId,
    });
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
}
