module.exports = {
  clearMocks: true,
  coverageProvider: "babel",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{js,ts}"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "json-summary"],
  setupFilesAfterEnv: ["./jestSetup.ts"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  transform: {
    "^.+\\.[t|j]s?$": "ts-jest",
  },
};
