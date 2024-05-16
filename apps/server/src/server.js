import "dotenv/config"
/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { static as _static } from "express"
import { json, urlencoded } from "body-parser"
import { join } from "path"
import config from "./config"
// import http from './infra/http'
import { wget as _wget, stream } from "./infra/http"
// import { wget as _wget, stream } from './infra/http/real'
import { error as _error, info } from "./infra/logger"
import useConnect from "./connect/connectApiExpress"
// import useVcs from './incubationVcs/vcsServiceExpress'
import { readFile } from "./utils/fs"
import RateLimit from "express-rate-limit"
import "express-async-errors"
import ngrok from "@ngrok/ngrok"
// import asyncify from 'express-asyncify'

process.on("unhandledRejection", (error) => {
  _error(`unhandledRejection: ${error.message}`, error)
})
process.removeAllListeners("warning") // remove the noise caused by capacitor-community/http fetch plugin
const app = express()
app.use(json())
app.use(urlencoded({ extended: true }))

const limiter = RateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5000, // max average 500 requests per windowMs
})
app.use(limiter)

app.get("/ping", function (req, res) {
  res.send("ok")
})

// Elastic search setup
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');

const client = new Client({ node: 'http://localhost:9200' });

const items = [1, 2, 3, 4, 5];

async function processItems() {
  for (const item of items) {
    await processItem(item);
  }
}

async function processItem(item) {
  // Simulate an asynchronous operation
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Processed item ${item}`);
      resolve();
    }, Math.random() * 1000);
  });
}

processItems();


async function indexDocuments() {
  await client.indices.create({ index: 'institutions' })
  console.log("indexing")
  const dataFilePath = 'ucw_institution_mapping.json';
  const rawData = fs.readFileSync(dataFilePath);
  const jsonData = JSON.parse(rawData);

  // const body = jsonData.flatMap(doc => [{ index: { _index: indexName } }, doc]);
  for(const institution of jsonData) {
    await client.index({
      index: 'institutions',
      id: institution.ucp_id,
      document: institution,
    })
  }

  console.log('done indexing')

  // const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  // if (bulkResponse.errors) {
  //   console.error('Failed to index documents:', bulkResponse.items);
  // } else {
  //   console.log('Successfully indexed documents:', bulkResponse.items);
  // }
}

app.get('/es-index', async (req, res) => {
  await indexDocuments();
  res.send("Indexed institutions")
})



app.get('/pong/:search_term', async (req, res) => {
  const stuff = await client.search({
    index: 'institutions',
    body: {
      query: {
        multi_match: {
          query: req.params.search_term,
          fields: ['name', 'keywords']
        }
      }
    }
  })
  const institutionHits = stuff.hits.hits.map(esObject => esObject._source)
  res.send(institutionHits)
})


useConnect(app)
// useVcs(app);
app.use(function (err, req, res, next) {
  _error(`Unhandled error on ${req.method} ${req.path}: `, err)
  res.status(500)
  res.send(err.message)
})
const pageQueries = new RegExp(
  [
    "institution_id",
    "job_type",
    "scheme",
    "auth",
    "user_id",
    "client_guid",
    "connection_id",
    "provider",
    "partner",
    "oauth_referral_source",
    "single_account_select",
    "update_credentials",
    "server",
    "is_mobile_webview",
    "include_identity",
  ]
    .map((r) => `\\$${r}`)
    .join("|"),
  "g"
)

function renderDefaultPage(req, res, html) {
  if (
    req.query.connection_id != null &&
    (req.query.provider == null || req.query.provider === "")
  ) {
    delete req.query.connection_id
  }
  res.send(
    html.replaceAll(pageQueries, (q) =>
      encodeURIComponent(req.query[q.substring(1)] ?? "")
    )
  )
}

app.get("/", async function (req, res) {
  info(`Serving UI resources from ${config.ResourcePrefix}`)
  req.metricsPath = "/catchall"
  const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
  await _wget(resourcePath).then((html) => {
    renderDefaultPage(req, res, html)
  })
})
app.get("*", async function (req, res) {
  info(`Serving UI resources from ${config.ResourcePrefix}`)
  req.metricsPath = "/catchall"
  const resourcePath = `${config.ResourcePrefix}${config.ResourceVersion}${req.path}`
  if (!req.path.includes("-hmr")) {
    await stream(resourcePath, null, res)
  } else {
    res.sendStatus(404)
  }
})

app.listen(config.PORT, () => {
  const message = `Server is running on port ${config.PORT}, Env: ${config.Env}, LogLevel: ${config.LogLevel}`
  const uiMessage = `UI is running on ${config.ResourcePrefix}`
  console.log(message)
  console.log(uiMessage)
  info(message)
  info(uiMessage)
})

// Ngrok is required for Finicity webhooks local and github testing
if (["dev", "test"].includes(config.Env)) {
  ngrok.listen(app).then(() => {
    config.WebhookHostUrl = app.listener.url()
    console.log("Established listener at: " + app.listener.url())
  })
}

process.on("SIGINT", async () => {
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C)")
  if (["dev", "test"].includes(config.Env)) {
    console.log("Closing Ngrok tunnel")
    await ngrok.kill()
  }
  process.exit(0)
})
