import 'dotenv/config'
/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { static as _static } from 'express'
import { json, urlencoded } from 'body-parser'
import { join } from 'path'
import config from './config'
// import http from './infra/http'
import { wget as _wget, stream } from './infra/http'
// import { wget as _wget, stream } from './infra/http/real'
import { error as _error, info } from './infra/logger'
import useConnect from './connect/connectApiExpress'
// import useVcs from './incubationVcs/vcsServiceExpress'
import { readFile } from './utils/fs'
import RateLimit from 'express-rate-limit'
import 'express-async-errors'
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
const pageQueries = new RegExp([
  'institution_id',
  'job_type',
  'scheme',
  'auth',
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
].map(r => `\\$${r}`).join('|'), 'g')

function renderDefaultPage (req, res, html) {
  if (req.query.connection_id != null && (req.query.provider == null || req.query.provider === '')) {
    delete req.query.connection_id
  }
  res.send(html.replaceAll(pageQueries, q => encodeURIComponent(req.query[q.substring(1)] ?? '')))
}

if (config.ResourcePrefix !== 'local') {
  app.get('/', async function (req, res) {
    info(`serving resources from ${config.ResourcePrefix}`)
    req.metricsPath = '/catchall'
    const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
    await _wget(resourcePath).then(html => { renderDefaultPage(req, res, html) })
  })
  app.get('*', async function (req, res) {
    info(`serving resources from ${config.ResourcePrefix}`)
    req.metricsPath = '/catchall'
    const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
    if (!req.path.includes('-hmr')) {
      await stream(resourcePath, null, res)
    } else {
      res.sendStatus(404)
    }
  })
} else {
  info('using local resources from "../ui/dist"')
  app.get('/', async (req, res) => {
    const filePath = join(__dirname, '../ui', 'dist', 'index.html')
    const html = await readFile(filePath)
    renderDefaultPage(req, res, html)
  })
  app.get('*', _static(join(__dirname, '../ui/dist')))
}

app.listen(config.PORT, () => {
  const message = `Server is running on port ${config.PORT}, Env: ${config.Env}`
  console.log(message)
  info(message)
})
