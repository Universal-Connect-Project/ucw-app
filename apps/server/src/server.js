import 'dotenv/config'
/* eslint-disable @typescript-eslint/no-misused-promises */
import { json, urlencoded } from 'body-parser'
import express from 'express'
import config from './config'
import { wget as _wget, stream } from './infra/http'
import useConnect from './connect/connectApiExpress'
import { error as _error, info } from './infra/logger'
import ngrok from '@ngrok/ngrok'
import 'express-async-errors'
import RateLimit from 'express-rate-limit'
import { initialize as initializeElastic } from './services/ElasticSearchClient'

// import asyncify from 'express-asyncify'

process.on('unhandledRejection', (error) => {
  _error(`unhandledRejection: ${error.message}`, error)
})
process.removeAllListeners('warning') // remove the noise caused by capacitor-community/http fetch plugin
const app = express()
app.use(json())
app.use(urlencoded({ extended: true }))

const limiter = RateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5000 // max average 500 requests per windowMs
})
app.use(limiter)

initializeElastic()
  .then((_) => {
    info('App initialized successfully')
  })
  .catch((error) => {
    _error(`Failed to initialized: ${error}`)
  })

app.get('/ping', function (req, res) {
  res.send('ok')
})

useConnect(app)
// useVcs(app);
app.use(function (err, req, res, next) {
  _error(`Unhandled error on ${req.method} ${req.path}: `, err)
  res.status(500)
  res.send(err.message)
})
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

function renderDefaultPage(req, res, html) {
  if (
    req.query.connection_id != null &&
    (req.query.provider == null || req.query.provider === '')
  ) {
    delete req.query.connection_id
  }
  res.send(
    html.replaceAll(pageQueryParameters, (q) =>
      encodeURIComponent(req.query[q.substring(1)] ?? '')
    )
  )
}

app.get('/', async function (req, res) {
  info(`Serving UI resources from ${config.ResourcePrefix}`)
  req.metricsPath = '/catchall'
  const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
  await _wget(resourcePath).then((html) => {
    renderDefaultPage(req, res, html)
  })
})
app.get('*', async function (req, res) {
  info(`Serving UI resources from ${config.ResourcePrefix}`)
  req.metricsPath = '/catchall'
  const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
  if (!req.path.includes('-hmr')) {
    await stream(resourcePath, null, res)
  } else {
    res.sendStatus(404)
  }
})

app.listen(config.PORT, () => {
  const message = `Server is running on port ${config.PORT}, Env: ${config.Env}, LogLevel: ${config.LogLevel}`
  const uiMessage = `UI is running on ${config.ResourcePrefix}`

  info(message)
  info(uiMessage)
})

// Ngrok is required for Finicity webhooks local and github testing
if (['dev', 'test'].includes(config.Env)) {
  ngrok.listen(app).then(() => {
    config.WebhookHostUrl = app.listener.url()
    info('Established listener at: ' + app.listener.url())
  })
}

process.on('SIGINT', async () => {
  info('\nGracefully shutting down from SIGINT (Ctrl-C)')
  if (['dev', 'test'].includes(config.Env)) {
    info('Closing Ngrok tunnel')
    await ngrok.kill()
  }
  process.exit(0)
})
