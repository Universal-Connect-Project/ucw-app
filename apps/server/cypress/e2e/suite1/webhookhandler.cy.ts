import { MX_INT_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { ConnectionStatus } from "@repo/utils";

describe("webhook", () => {
  const PORT: number = 8080;

  it("receives the request without errors", () => {
    cy.request({
      url: `http://localhost:${PORT}/webhook/${MX_INT_AGGREGATOR_STRING}/?status=success`,
    }).then((response: Cypress.Response<{ status: number }>) => {
      expect(response.status).to.eq(200);
      expect(response.body.status).to.eq(ConnectionStatus.CONNECTED);
    });
  });
});
