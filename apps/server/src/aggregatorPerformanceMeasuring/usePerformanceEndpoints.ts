import { type Application } from "express";
import { OAUTH_START_URL } from "@repo/utils";
import { startOauthPerformance } from "./performanceEndpoints";

const usePerformanceEndpoints = (app: Application) => {
  app.post(OAUTH_START_URL, startOauthPerformance);
};

export default usePerformanceEndpoints;
