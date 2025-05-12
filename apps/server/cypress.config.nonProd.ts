import { defineConfig } from "cypress";

import baseCypressConfig from "./baseCypressConfig";

export default defineConfig({
  ...baseCypressConfig,
  e2e: {
    ...baseCypressConfig.e2e,
    specPattern: "cypress/e2e/nonProdSuite/**/*.{js,jsx,ts,tsx}",
  },
});
