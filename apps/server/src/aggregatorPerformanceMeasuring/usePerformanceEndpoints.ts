import { type Application } from "express";
import { OAUTH_START_URL } from "@repo/utils";
import { startOAuthPerformance } from "./startOAuthPerformance";

const usePerformanceEndpoints = (app: Application) => {
  app.post(OAUTH_START_URL, startOAuthPerformance);
};

export default usePerformanceEndpoints;
