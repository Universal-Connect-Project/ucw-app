import { defineConfig } from "cypress";
import baseCypressConfig from "./cypress.config.base.ts";

export default defineConfig({
  ...baseCypressConfig,
  e2e: {
    ...baseCypressConfig.e2e,
    specPattern: "cypress/e2e/proxy/*.{js,jsx,ts,tsx}",
  },
});
