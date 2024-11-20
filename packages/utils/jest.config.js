module.exports = {
  clearMocks: true,
  coverageProvider: "babel",
  collectCoverage: true,
  collectCoverageFrom: ["**/*.{js,jsx,ts,tsx}"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "json-summary"],
  setupFiles: ["dotenv/config"],
  // setupFilesAfterEnv: ['./jestSetup.ts'],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  transform: {
    "^.+\\.[t|j]s?$": "ts-jest",
  },
};
