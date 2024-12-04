import type { Express } from "express";
import {
  createAccountsDataHandler,
  createIdentityDataHandler,
  createTransactionsDataHandler,
} from "./dataEndpoints";
import { getConfig } from "../config";

const useDataEndpoints = (app: Express) => {
  const config = getConfig();

  if (config.DATA_ENDPOINTS_ENABLE === "true") {
    // Data Endpoints
    app.get(
      "/api/data/aggregator/:aggregator/user/:userId/connection/:connectionId/accounts",
      createAccountsDataHandler(false),
    );
    app.get(
      "/api/data/aggregator/:aggregator/user/:userId/connection/:connectionId/identity",
      createIdentityDataHandler(false),
    );
    app.get(
      "/api/data/aggregator/:aggregator/user/:userId/account/:accountId/transactions",
      createTransactionsDataHandler(false),
    );

    // VC Data Endpoints
    app.get(
      "/api/vc/data/aggregator/:aggregator/user/:userId/connection/:connectionId/accounts",
      createAccountsDataHandler(true),
    );
    app.get(
      "/api/vc/data/aggregator/:aggregator/user/:userId/connection/:connectionId/identity",
      createIdentityDataHandler(true),
    );
    app.get(
      "/api/vc/data/aggregator/:aggregator/user/:userId/account/:accountId/transactions",
      createTransactionsDataHandler(true),
    );
  }
};

export default useDataEndpoints;
