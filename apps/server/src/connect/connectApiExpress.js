import * as path from 'path'
import config from '../config'
import { contextHandler } from '../infra/context.ts'
import { wget } from '../infra/http'
import { info } from '../infra/logger'
import { instrumentation } from '../providers'
import { ApiEndpoints } from '../shared/connect/ApiEndpoint'
import { ConnectionStatus } from '../shared/contract.ts'
import { ConnectApi } from './connectApi'
import stubs from './instrumentations.js'

const AGGREGATION_JOB_TYPE = 0

const disableAnalytics = true

export default function (app) {
  stubs(app)
  app.use(contextHandler)
  app.use(async (req, res, next) => {
    if (
      req.path === '/' ||
      req.path.startsWith('/example') === true ||
      req.path.startsWith('/static') === true
    ) { return next() }
    req.connectService = new ConnectApi(req)
    if ((await req.connectService.init()) != null) {
      if (
        req.context.resolved_user_id == null ||
        req.context.resolved_user_id === ''
      ) {
        req.context.resolved_user_id = await req.connectService.ResolveUserId(
          req.context.user_id
        )
      }
    }
    next()
  })

  app.post('/analytics*', async (req, res) => {
    if (disableAnalytics) {
      res.sendStatus(200)
      return
    }

    if (
      config.Env !== 'test' &&
      config.AnalyticsServiceEndpoint !== '' &&
      config.AnalyticsServiceEndpoint != null
    ) {
      const ret = await req.connectService.analytics(req.path, req.body)
      res.send(ret)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      res.send(require('./stubs/analytics_sessions.js'))
    }
  })

  app.post(ApiEndpoints.MEMBERS, async (req, res) => {
    // res.send(require('./stubs/member.js'))
    // return;
    const ret = await req.connectService.addMember(req.body)
    res.send(ret)
  })
  app.put(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    // res.send(require('./stubs/member.js'))
    // return;
    const ret = await req.connectService.updateMember(req.body)
    res.send(ret)
  })
  app.get(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    // res.send(require('./stubs/member.js'))
    // return;
    const ret = await req.connectService.loadMemberByGuid(
      req.params.member_guid
    )
    res.send(ret)
    // res.sendFile(__dirname + '/stubs/member.json')
  })
  app.get(
    `${ApiEndpoints.MEMBERS}/:member_guid/credentials`,
    async (req, res) => {
      // res.send(require('./stubs/member_credentials.js'))
      // return;
      const ret = await req.connectService.getMemberCredentials(
        req.params.member_guid
      )
      res.send(ret)
    }
  )
  app.get(
    `${ApiEndpoints.MEMBERS}/:member_guid/oauth_window_uri`,
    async (req, res) => {
      const ret = await req.connectService.getOauthWindowUri(
        req.params.member_guid
      )
      res.send({ oauth_window_uri: ret })
      // res.sendFile(__dirname + '/stubs/member.json')
    }
  )
  app.delete(`${ApiEndpoints.MEMBERS}/:member_guid`, async (req, res) => {
    res.sendFile(path.join(__dirname, '/stubs/member.json'))
    // let ret = await req.connectService.deleteMember(req.params.member_guid)
    // res.send(ret)
  })
  app.get(
    `${ApiEndpoints.INSTITUTIONS}/:institution_guid/credentials`,
    async (req, res) => {
      const credentials = await req.connectService.getInstitutionCredentials(
        req.params.institution_guid
      )
      res.send(credentials)
    }
  )

  app.get(`${ApiEndpoints.INSTITUTIONS}/favorite`, async (req, res) => {
    const popularInsitutions = await req.connectService.loadPopularInstitutions()
    res.send(popularInsitutions)
  })

  app.get(`${ApiEndpoints.INSTITUTIONS}/discovered`, async (req, res) => {
    const ret = await req.connectService.loadDiscoveredInstitutions()
    res.send(ret)
  })
  app.get(
    `${ApiEndpoints.INSTITUTIONS}/:institution_guid`,
    async (req, res) => {
      const ret = await req.connectService.loadInstitutionByUcpId(
        req.params.institution_guid
      )
      res.send(ret)
    }
  )
  app.get(ApiEndpoints.INSTITUTIONS, async (req, res) => {
    const ret = await req.connectService.loadInstitutions(
      req.query.search_name ?? req.query.routing_number
    )
    res.send(ret)
  })
  app.get('/jobs/:member_guid', async (req, res) => {
    if (['mx_int', 'mx'].includes(req.context.provider)) {
      if (req.params.member_guid === 'null') {
        res.send({ job: { guid: 'none', job_type: AGGREGATION_JOB_TYPE } })
        return
      }
      const ret = await req.connectService.loadMemberByGuid(
        req.params.member_guid
      )
      res.send(ret)
    } else {
      res.send({
        job: {
          guid: req.params.member_guid,
          job_type: AGGREGATION_JOB_TYPE
        }
      })
    }
  })

  app.get('/oauth_states', async (req, res) => {
    const ret = await req.connectService.getOauthStates(
      req.query.outbound_member_guid
    )
    res.send(ret)
  })

  app.get('/oauth_states/:guid', async (req, res) => {
    const ret = await req.connectService.getOauthState(req.params.guid)
    res.send(ret)
  })

  app.get(ApiEndpoints.MEMBERS, async (req, res) => {
    const ret = await req.connectService.loadMembers()
    res.send({
      members: ret
    })
  })

  app.post(
    `${ApiEndpoints.MEMBERS}/:member_guid/identify`,
    async (req, res) => {
      const ret = await req.connectService.updateConnection(
        { id: req.params.member_guid, job_type: 'aggregate_identity' },
        req.context.resolved_user_id
      )
      res.send({
        members: ret
      })
    }
  )

  app.post(`${ApiEndpoints.MEMBERS}/:member_guid/verify`, async (req, res) => {
    const ret = await req.connectService.updateConnection(
      { id: req.params.member_guid, job_type: 'verification' },
      req.context.resolved_user_id
    )
    res.send({
      members: ret
    })
  })

  app.post(`${ApiEndpoints.MEMBERS}/:member_guid/history`, async (req, res) => {
    const ret = await req.connectService.updateConnection(
      { id: req.params.member_guid, job_type: 'aggregate_extendedhistory' },
      req.context.resolved_user_id
    )
    res.send({
      members: ret
    })
  })

  app.post(ApiEndpoints.INSTRUMENTATION, async (req, res) => {
    if (await instrumentation(req.context, req.body.instrumentation)) {
      res.sendStatus(200)
      return
    }
    res.sendStatus(400)
  })

  app.post('/members/:member_guid/unthrottled_aggregate', async (req, res) => {
    const ret = await req.connectService.updateConnection(
      { id: req.params.member_guid, job_type: 'aggregate' },
      req.context.resolved_user_id
    )
    res.send({
      members: ret
    })
  })

  app.all('/webhook/:provider/*', async function (req, res) {
    const { provider } = req.params
    info(`received web hook at: ${req.path}`, req.query)
    const ret = await ConnectApi.handleOauthResponse(
      provider,
      req.params,
      req.query,
      req.body
    )
    res.send(ret)
  })

  app.get('/oauth/:provider/redirect_from/', async (req, res) => {
    const { provider } = req.params
    const ret = await ConnectApi.handleOauthResponse(
      provider,
      req.params,
      req.query
    )

    const metadata = JSON.stringify({
      member_guid: ret?.id,
      error_reason: ret?.error
    })
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const app_url = `${ret?.scheme}://oauth_complete?metadata=${encodeURIComponent(metadata)}`
    const queries = {
      status: ret?.status === ConnectionStatus.CONNECTED ? 'success' : 'error',
      app_url,
      redirect:
        ret?.oauth_referral_source?.toLowerCase() === 'browser'
          ? 'false'
          : 'true',
      error_reason: ret?.error,
      member_guid: ret?.id
    }

    const oauthParams = new RegExp(
      Object.keys(queries)
        .map((r) => `\\$${r}`)
        .join('|'),
      'g'
    )
    function mapOauthParams (queries, res, html) {
      res.send(
        html.replaceAll(oauthParams, (q) => queries[q.substring(1)] ?? '')
      )
    }

    const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}/oauth/success.html`
    await wget(resourcePath).then((html) => {
      mapOauthParams(queries, res, html)
    })
  })
}
