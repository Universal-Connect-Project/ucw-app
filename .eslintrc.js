// import stylistic from '@stylistic/eslint-plugin';

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: [
    'standard-with-typescript',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    '@stylistic',
    // { '@stylistic': stylistic }
  ],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [],
  rules: {
    semi: 'off',
    '@typescript-eslint/semi': ['warn', 'always'],

    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@stylistic/comma-dangle': ['error', 'always-multiline'],

    'eol-last': 'off',
    '@stylistic/eol-last': ['error', 'always'],

    'no-trailing-spaces': 'off',
    '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],

    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};
