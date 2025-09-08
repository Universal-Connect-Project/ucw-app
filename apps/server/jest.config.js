module.exports = {
  clearMocks: true,
  coverageProvider: "babel",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/config/*.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "json-summary"],
  setupFiles: ["./src/dotEnv.ts"],
  setupFilesAfterEnv: ["./jestSetup.ts"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/src/utils/Test.js",
    "<rootDir>/src/config/",
  ],
  transformIgnorePatterns: ["/node_modules/(?!(@kyper)/).*/"],
  transform: {
    "^.+\\.[t|j]s?$": "ts-jest",
  },
  moduleNameMapper: {
    "^axios$": require.resolve("axios"),
  },
};
