// This configuration only applies to the package manager root.
/** @type {import("eslint").Linter.Config} */
module.exports = {
  ignorePatterns: ["apps/**", "packages/**"],
  extends: ["./packages/eslint-config/base"],
  parser: "@typescript-eslint/parser",
};
