const baseCypressConfig = {
  e2e: {
    retries: 1,
    defaultCommandTimeout: 15000,
    baseUrl: "http://localhost:8080",
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
};

export default baseCypressConfig;
