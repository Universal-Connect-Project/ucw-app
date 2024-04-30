import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    retries: 1,
    defaultCommandTimeout: 15000,
    setupNodeEvents (on, config) {
      // implement node event listeners here
    }
  }
})
