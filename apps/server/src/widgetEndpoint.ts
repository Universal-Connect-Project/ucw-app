import { Request, Response } from 'express'
import { wget as _wget } from './infra/http'
import Joi from 'joi'
import { JobTypes, Providers } from './shared/contract'
import config from './config'
import { providers } from './adapterSetup'

const pageQueryParameters = new RegExp(
  [
    'institution_id',
    'job_type',
    'scheme',
    'user_id',
    'client_guid',
    'connection_id',
    'provider',
    'partner',
    'oauth_referral_source',
    'single_account_select',
    'update_credentials',
    'server',
    'is_mobile_webview',
    'include_identity'
  ]
    .map((r) => `\\$${r}`)
    .join('|'),
  'g'
)

function renderDefaultPage(req: Request, res: Response, html: string) {
  if (
    req.query.connection_id != null &&
    (req.query.provider == null || req.query.provider === '')
  ) {
    delete req.query.connection_id
  }
  res.send(
    html.replaceAll(pageQueryParameters, (q: string) =>
      encodeURIComponent((req.query as any)[q.substring(1)] ?? '')
    )
  )
}

export const widgetHandler = (req: Request, res: Response) => {
  const schema = Joi.object({
    connection_id: Joi.string(),
    institution_id: Joi.string(),
    job_type: Joi.string()
      .valid(...Object.values(JobTypes))
      .required(),
    provider: Joi.string().valid(...providers),
    single_account_select: Joi.bool(),
    user_id: Joi.string().required()
  }).and('connection_id', 'provider')

  const { error } = schema.validate(req.query)

  if (error) {
    res.status(400)
    res.send(error.details[0].message)

    return
  }

  ;(req as any).metricsPath = '/catchall'
  const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
  void _wget(resourcePath).then((html) => {
    renderDefaultPage(req, res, html)
  })
}
