describe("Express", () => {
  const PORT: number = 8080;

  it("checks service status is healthy", () => {
    cy.request(`http://localhost:${PORT}/health`).then(
      (response: Cypress.Response<{ message: string }>) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.eq("healthy");
      },
    );
  });

});
