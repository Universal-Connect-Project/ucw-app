import { ComboJobTypes } from "@repo/utils/contract";

export const visitWithPostMessageSpy = (url: string) =>
  cy.visit(url, {
    onBeforeLoad(window) {
      cy.spy(window.parent, "postMessage").as("postMessage");
    },
  });

export const visitIdentity = () => {
  const userId = crypto.randomUUID();

  cy.visit(`/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&user_id=${userId}`);

  return cy.wrap(userId);
};

export const visitAgg = (options?: any) => {
  const { failOnStatusCode, token, userId: userIdOverride } = options || {};

  const userId = userIdOverride || crypto.randomUUID();

  const tokenString = token ? `&token=${token}` : "";

  cy.visit(
    `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&user_id=${userId}${tokenString}`,
    {
      failOnStatusCode,
    },
  );

  return cy.wrap(userId);
};
