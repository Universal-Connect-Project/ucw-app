const baseCypressConfig = {
  e2e: {
    retries: 3,
    defaultCommandTimeout: 15000,
    baseUrl: 'http://localhost:8080',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    }
  }
}

export default baseCypressConfig
