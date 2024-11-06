export const visitWithPostMessageSpy = (url: string) =>
  cy.visit(url, {
    onBeforeLoad(window) {
      cy.spy(window.parent, "postMessage").as("postMessage");
    },
  });

export const visitIdentity = () => {
  const userId = crypto.randomUUID();

  cy.visit(`/?job_type=identity&user_id=${userId}`);

  return cy.wrap(userId);
};

export const visitAgg = () => {
  const userId = crypto.randomUUID();

  cy.visit(`/?job_type=aggregate&user_id=${userId}`);

  return cy.wrap(userId);
};
