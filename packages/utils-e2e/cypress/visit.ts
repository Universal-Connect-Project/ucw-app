import { ComboJobTypes } from "@repo/utils/contract";
import { createWidgetUrl } from "./createWidgetUrl";

export const visitWithPostMessageSpy = (url: string) =>
  cy.visit(url, {
    onBeforeLoad(window) {
      cy.spy(window.parent, "postMessage").as("postMessage");
    },
  });

export const visitIdentity = () => {
  const userId = crypto.randomUUID();

  createWidgetUrl({
    jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
    userId,
    targetOrigin: "http://localhost:8080",
  }).then((widgetUrl) => {
    cy.visit(widgetUrl);
  });

  return cy.wrap(userId);
};

export const visitAgg = (options?: any) => {
  const {
    aggregatorOverride,
    failOnStatusCode,
    authToken,
    userId: userIdOverride,
  } = options || {};

  const userId = userIdOverride || crypto.randomUUID();

  createWidgetUrl({
    jobTypes: [ComboJobTypes.TRANSACTIONS],
    userId,
    targetOrigin: "http://localhost:8080",
    authToken,
    aggregatorOverride,
  }).then((widgetUrl) => {
    cy.visit(widgetUrl, { failOnStatusCode });
  });

  return cy.wrap(userId);
};
