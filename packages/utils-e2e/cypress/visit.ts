import { ComboJobTypes } from "@repo/utils/contract";

export const visitWithPostMessageSpy = (url: string) =>
  cy.visit(url, {
    onBeforeLoad(window) {
      cy.spy(window.parent, "postMessage").as("postMessage");
    },
  });

export const visitIdentity = () => {
  const userId = crypto.randomUUID();

  cy.visit(
    `/widget?jobTypes=${ComboJobTypes.ACCOUNT_OWNER}&userId=${userId}&targetOrigin=http://localhost:8080`,
  );

  return cy.wrap(userId);
};

export const visitAgg = (options?: any) => {
  const {
    aggregatorOverride,
    failOnStatusCode,
    token,
    userId: userIdOverride,
  } = options || {};

  const userId = userIdOverride || crypto.randomUUID();

  const tokenString = token ? `&token=${token}` : "";

  const aggregatorOverrideString = aggregatorOverride
    ? `&aggregatorOverride=${aggregatorOverride}`
    : "";

  cy.visit(
    `/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}${tokenString}${aggregatorOverrideString}&targetOrigin=http://localhost:8080`,
    {
      failOnStatusCode,
    },
  );

  return cy.wrap(userId);
};
