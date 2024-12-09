import type { Express } from "express";

import { userDeleteHandler } from "./userEndpoints";
import { getConfig } from "../config";

const useUserEndpoints = (app: Express) => {
  const config = getConfig();

  if (config.USER_DELETE_ENDPOINT_ENABLE === "true") {
    app.delete("/api/aggregator/:aggregator/user/:userId", userDeleteHandler);
  }
};

export default useUserEndpoints;
