module.exports = {
  root: true,
  env: {
    'browser': true,
    'node': true,
    'es6': true,
    'jest': true
  },
  extends: [
    'eslint:recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['src/public/static/vue3.js'],
  rules: {
    quotes: ['error', 'single', { 'avoidEscape': true }],
    'semi': [2, 'always'],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  }
};