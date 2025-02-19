describe("webhook", () => {
  const PORT: number = 8080;

  it("receives the request without errors", async () => {
    cy.request(`http://localhost:${PORT}/webhook/testExampleA/?code=success_code&state=request_id`).then(
      (response: Cypress.Response<{ message: string }>) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.eq("");
      },
    );
  });

});