import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    retries: 1,
    defaultCommandTimeout: 15000,
    specPattern: 'cypress/e2e/suite1/**/*.{js,jsx,ts,tsx}',
    setupNodeEvents (on, config) {
      // implement node event listeners here
    }
  }
})
