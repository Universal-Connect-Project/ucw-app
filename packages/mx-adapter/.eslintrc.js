module.exports = {
  extends: ["../../packages/eslint-config/node.json"],
  env: {
    node: true,
    es6: true,
    jest: true
  },
  parserOptions: {
    project: "tsconfig.json"
  },
  ignorePatterns: [
    ".eslintrc.js",
    "jest.config.cjs",
    "jestSetup.ts",
    "cypress.config.js",
    "cypress.config.base.js",
    "cypress/**/*",
    "playwright.config.ts",
    "playwright/**/*",
    "__mocks__/",
    "*.test.*",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off", // TODO: remove and fix later
    "@typescript-eslint/strict-boolean-expressions": "off", // TODO: remove and fix later
    "@typescript-eslint/prefer-nullish-coalescing": "off",  // TODO: remove and fix later
    "@typescript-eslint/explicit-function-return-type": "off", // TODO: remove and fix later
    "@typescript-eslint/no-unsafe-argument": ["off"], // TODO: remove and fix later
    "@typescript-eslint/no-non-null-assertion": "off", // TODO: remove and fix later
    "@typescript-eslint/consistent-type-imports": ["error", {
      "disallowTypeAnnotations": false
    }], // TODO: remove and fix later
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-unused-vars": process.env.NODE_ENV === "production" ? "warn" : "off"
  }
};
