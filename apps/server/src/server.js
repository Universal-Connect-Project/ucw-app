import ngrok from '@ngrok/ngrok'
import { json, urlencoded } from 'body-parser'
import 'dotenv/config'
import express from 'express'
import 'express-async-errors'
import RateLimit from 'express-rate-limit'
import config from './config'
import useConnect from './connect/connectApiExpress'
import { stream } from './infra/http'
import { error as _error, info } from './infra/logger'
import { initialize as initializeElastic } from './services/ElasticSearchClient'
import { setInstitutionSyncSchedule } from './services/institutionSyncer'
import { widgetHandler } from './widgetEndpoint'

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
    setInstitutionSyncSchedule(config.INSTITUTION_POLLING_INTERVAL)
      .then((_) => {
        info(
          `Started institution poller for every ${config.INSTITUTION_POLLING_INTERVAL} minutes`
        )
      })
      .catch((_error) => {
        _error('Failed to start institution poller', _error)
      })
  })
  .catch((error) => {
    _error(`Failed to initialized: ${error}`)
  })

app.get('/ping', function (req, res) {
  res.send('ok')
})

useConnect(app)

app.use(function (err, req, res, next) {
  _error(`Unhandled error on ${req.method} ${req.path}: `, err)
  res.status(500)
  res.send(err.message)
})

app.get('/', widgetHandler)

app.get('*', (req, res) => {
  req.metricsPath = '/catchall'
  const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
  if (!req.path.includes('-hmr')) {
    void stream(resourcePath, null, res)
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

process.on('SIGINT', () => {
  info('\nGracefully shutting down from SIGINT (Ctrl-C)')
  if (['dev', 'test'].includes(config.Env)) {
    info('Closing Ngrok tunnel')
    void ngrok.kill()
  }
  process.exit(0)
})
