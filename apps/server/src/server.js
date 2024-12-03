import "dotenv/config";
import ngrok from "@ngrok/ngrok";
import cookieParser from "cookie-parser";
import express from "express";
import "express-async-errors";
import RateLimit from "express-rate-limit";

import config from "./config";
import useConnect from "./connect/connectApiExpress";
import { error as _error, info } from "./infra/logger";
import { initialize as initializeElastic } from "./services/ElasticSearchClient";
import { setInstitutionSyncSchedule } from "./services/institutionSyncer";
import { widgetHandler } from "./widgetEndpoint";
import useAuthentication from "./authentication";
import path from "path";

process.on("unhandledRejection", (error) => {
  _error(`unhandledRejection: ${error.message}`, error);
});
process.removeAllListeners("warning"); // remove the noise caused by capacitor-community/http fetch plugin

let isReady = false;
const app = express();
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
      .catch((_error) => {
        _error("Failed to start institution poller", _error);
      });
  })
  .catch((error) => {
    _error(`Failed to initialized: ${error}`);
  });

app.get("/health", function (req, res) {
  if (isReady) {
    res.send("healthy");
  } else {
    res.status(503);
    res.send("Service Unavailable");
  }
});

useAuthentication(app);

useConnect(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (err, req, res, next) {
  _error(`Unhandled error on ${req.method} ${req.path}: `, err);
  res.status(500);
  res.send(err.message);
});

app.use(express.static(path.join(__dirname, "../../ui/dist")));

app.get("/widget", widgetHandler);

app.get("*", (req, res) => {
  req.metricsPath = "/catchall";
  res.sendStatus(404);
});

app.listen(config.PORT, () => {
  const message = `Server is running on port ${config.PORT}, Env: ${config.Env}, LogLevel: ${config.LogLevel}`;

  info(message);
});

// Ngrok is required for Finicity webhooks local and github testing
if (["dev", "test"].includes(config.Env)) {
  ngrok.listen(app).then(() => {
    config.WebhookHostUrl = app.listener.url();
    info("Established listener at: " + app.listener.url());
  });
}

process.on("SIGINT", () => {
  info("\nGracefully shutting down from SIGINT (Ctrl-C)");
  if (["dev", "test"].includes(config.Env)) {
    info("Closing Ngrok tunnel");
    void ngrok.kill();
  }
  process.exit(0);
});
