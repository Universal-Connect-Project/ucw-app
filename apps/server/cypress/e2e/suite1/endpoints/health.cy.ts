describe("health", () => {
  it("checks service status is healthy", () => {
    cy.request("/health").then(
      (response: Cypress.Response<{ message: string }>) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.eq("healthy");
      },
    );
  });
});
