import { defineConfig } from "cypress";
import baseCypressConfig from "./cypress.config.base.js";

export default defineConfig({
  ...baseCypressConfig,
  e2e: {
    ...baseCypressConfig.e2e,
    specPattern: "cypress/e2e/*.{js,jsx,ts,tsx}",
  },
});
