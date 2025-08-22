import "dotenv/config";
import config from "./config";
import cookieParser from "cookie-parser";
import express from "express";
import "express-async-errors";
import RateLimit from "express-rate-limit";
import path from "path";
import useAuthentication from "./authentication";
import useConnect from "./connect/connectApiExpress";
import useUserEndpoints from "./connect/useUserEndpoints";
import useDataEndpoints from "./dataEndpoints/useDataEndpoints";
import { error as _error, info } from "./infra/logger";
import { initialize as initializeElastic } from "./services/ElasticSearchClient";
import { setInstitutionSyncSchedule } from "./services/institutionSyncer";
import { initializePerformanceAndCleanup } from "./services/appInitializer";
import { widgetHandler } from "./widgetEndpoint";
import { oauthRedirectHandler, webhookHandler } from "./connect/oauthEndpoints";
import useInstitutionEndpoints from "./institutions/useInstitutionEndpoints";
import { startNgrok, stopNgrok } from "./webhooks";
import { setPerformanceSyncSchedule } from "./services/performanceSyncer";
import cors from "cors";
import usePerformanceEndpoints from "./aggregatorPerformanceMeasuring/usePerformanceEndpoints";
import { contextHandler } from "./infra/context";

process.on("unhandledRejection", (error) => {
  _error(`unhandledRejection: ${error.message}`, error);
});
process.removeAllListeners("warning"); // remove the noise caused by capacitor-community/http fetch plugin

let isReady = false;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = RateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5000, // max average 500 requests per windowMs
});
app.use(limiter);

app.use(cookieParser());

initializeElastic()
  .then(() => {
    isReady = true;
    info("App initialized successfully");
    setInstitutionSyncSchedule(config.INSTITUTION_POLLING_INTERVAL)
      .then(() => {
        info(
          `Started institution poller for every ${config.INSTITUTION_POLLING_INTERVAL} minutes`,
        );
      })
      .catch((error) => {
        _error("Failed to start institution poller", error);
      });
  })
  .catch((error) => {
    _error(`Failed to initialized: ${error}`);
  });

setPerformanceSyncSchedule().then(() => {
  info("Performance based routing data is scheduled to sync");
});

initializePerformanceAndCleanup().catch((error) => {
  _error("Failed to initialize performance and cleanup", error);
});

app.get("/health", function (req, res) {
  if (isReady) {
    res.send("healthy");
  } else {
    res.status(503);
    res.send("Service Unavailable");
  }
});

useUserEndpoints(app);
useDataEndpoints(app);

app.all("/webhook/:aggregator/*", webhookHandler);
app.get("/oauth/:aggregator/redirect_from/", oauthRedirectHandler);

app.use(express.static(path.join(__dirname, "../../ui/dist")));

useAuthentication(app);

app.get("/widget", widgetHandler);

app.use(contextHandler);

useConnect(app);
usePerformanceEndpoints(app);

useInstitutionEndpoints(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (err, req, res, next) {
  _error(`Unhandled error on ${req.method} ${req.path}: `, err);
  res.status(err.status ? err.status : 500);
  res.send(err.message);
});

app.get("*", (req, res) => {
  req.metricsPath = "/catchall";
  res.sendStatus(404);
});

if (!config.PORT) {
  throw new Error("Invalid config, unable to start server");
}

app.listen(config.PORT, () => {
  const message = `Server is running on port ${config.PORT}, ENV: ${config.ENV}, LOG_LEVEL: ${config.LOG_LEVEL}`;

  info(message);
});

// Ngrok is required for local webhooks and github testing
startNgrok(app);

process.on("SIGINT", () => {
  info("\nGracefully shutting down from SIGINT (Ctrl-C)");
  stopNgrok();

  process.exit(0);
});
