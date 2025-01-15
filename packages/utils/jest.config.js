module.exports = {
  clearMocks: true,
  coverageProvider: "babel",
  collectCoverage: true,
  collectCoverageFrom: ["**/*.{js,jsx,ts,tsx}"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "json-summary"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  transform: {
    "^.+\\.[t|j]s?$": "ts-jest",
  },
};
