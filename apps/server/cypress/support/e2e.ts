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

configure({ testIdAttribute: "data-test" });

Cypress.on("uncaught:exception", () => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

before(() => {
  if (Cypress.env("auth_audience")) {
    cy.request({
      method: "POST",
      url: `https://${Cypress.env("auth_domain")}/oauth/token`,
      body: {
        audience: Cypress.env("auth_audience"),
        client_id: Cypress.env("auth_client_id"),
        grant_type: "password",
        password: Cypress.env("auth_password") as string,
        username: Cypress.env("auth_username") as string,
        scope: Cypress.env("auth_scope"),
      },
    }).then((response: Cypress.Response<JwtPayload>) => {
      const accessToken = response.body.access_token;

      Cypress.env("accessToken", accessToken);
    });
  }
});

beforeEach(() => {
  Cypress.env("userId", crypto.randomUUID());
});

afterEach(() => {
  const testAggregators = ["mx_int", "sophtron"];
  const userId = Cypress.env("userId");

  testAggregators.forEach((aggregator) => {
    cy.request({
      headers: {
        authorization: `Bearer ${Cypress.env("accessToken")}`,
      },
      method: "DELETE",
      url: `/api/aggregator/${aggregator}/user/${userId}`,
      failOnStatusCode: false,
    }).should((response) => {
      expect(response.status).to.be.oneOf([200, 204, 400]);
    });
  });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
