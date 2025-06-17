import dotenv from "dotenv";
import path from "path";

if (process.env.ENV === "prod") {
  dotenv.config({
    path: [
      path.join(__dirname, "../env/production.env"),
      path.join(__dirname, "../env/sharedProduction.env"),
    ],
  });
} else {
  dotenv.config({
    path: [
      path.join(__dirname, "../env/staging.env"),
      path.join(__dirname, "../env/sharedStaging.env"),
    ],
  });
}
