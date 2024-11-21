import { defineConfig } from "cypress";

import baseCypressConfig from "./baseCypressConfig";

export default defineConfig({
  ...baseCypressConfig,
  e2e: {
    ...baseCypressConfig.e2e,
    specPattern: "cypress/e2e/authenticationSuite/**/*.{js,jsx,ts,tsx}",
  },
});
