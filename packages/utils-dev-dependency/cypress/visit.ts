export const visitWithPostMessageSpy = (url: string) =>
  cy.visit(url, {
    onBeforeLoad(window) {
      cy.spy(window.parent, "postMessage").as("postMessage");
    },
  });

export const visitIdentity = () => {
  const userId = crypto.randomUUID();

  cy.visit(`/widget?job_type=identity&user_id=${userId}`);

  return cy.wrap(userId);
};

export const visitAgg = (options) => {
  const { failOnStatusCode, token, userId: userIdOverride } = options || {};

  const userId = userIdOverride || crypto.randomUUID();

  const tokenString = token ? `&token=${token}` : "";

  cy.visit(`/widget?job_type=aggregate&user_id=${userId}${tokenString}`, {
    failOnStatusCode,
  });

  return cy.wrap(userId);
};
