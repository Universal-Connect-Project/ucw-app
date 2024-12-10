// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

import { configure } from "@testing-library/cypress";
import { JwtPayload } from "jsonwebtoken";
import {
  WIDGET_DEMO_ACCESS_TOKEN_ENV,
  WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
  WIDGET_DEMO_DELETE_USER_ACCESS_TOKEN_ENV,
} from "../shared/constants/accessToken";

configure({ testIdAttribute: "data-test" });

Cypress.on("uncaught:exception", () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

const authenticateAndStoreAccessToken = ({
  accessTokenEnvString,
  passwordEnvString,
  scopeEnvString,
  usernameEnvString,
}: {
  accessTokenEnvString: string;
  passwordEnvString: string;
  scopeEnvString: string;
  usernameEnvString: string;
}) => {
  cy.request({
    method: "POST",
    url: `https://${Cypress.env("auth_domain")}/oauth/token`,
    body: {
      audience: Cypress.env("auth_audience"),
      client_id: Cypress.env("auth_client_id"),
      grant_type: "password",
      password: Cypress.env(passwordEnvString) as string,
      username: Cypress.env(usernameEnvString) as string,
      scope: Cypress.env(scopeEnvString),
    },
  }).then((response: Cypress.Response<JwtPayload>) => {
    const accessToken = response.body.access_token;

    Cypress.env(accessTokenEnvString, accessToken);
  });
};

before(() => {
  if (Cypress.env("auth_audience")) {
    authenticateAndStoreAccessToken({
      accessTokenEnvString: WIDGET_DEMO_ACCESS_TOKEN_ENV,
      passwordEnvString: "auth_widget_demo_password",
      scopeEnvString: "auth_widget_demo_scope",
      usernameEnvString: "auth_widget_demo_username",
    });

    authenticateAndStoreAccessToken({
      accessTokenEnvString: WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV,
      passwordEnvString: "auth_widget_demo_data_password",
      scopeEnvString: "auth_widget_demo_data_scope",
      usernameEnvString: "auth_widget_demo_data_username",
    });

    authenticateAndStoreAccessToken({
      accessTokenEnvString: WIDGET_DEMO_DELETE_USER_ACCESS_TOKEN_ENV,
      passwordEnvString: "auth_widget_demo_delete_user_password",
      scopeEnvString: "auth_widget_demo_delete_user_scope",
      usernameEnvString: "auth_widget_demo_delete_user_username",
    });
  }
});

beforeEach(() => {
  Cypress.env("userId", crypto.randomUUID());
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
