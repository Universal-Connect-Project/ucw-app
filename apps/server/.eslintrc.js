module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
  },
  extends: ['standard-with-typescript'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'cypress'],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  ignorePatterns: [
    '.eslintrc.js',
    'jest.config.js',
    'jestSetup.ts',
    'babel.config.js',
    'cypress.config.ts',
    'cypress.config.*.ts',
    'cypress/**/*'
  ],
  rules: {
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/no-namespace': 'off', // TODO: remove and fix later
    '@typescript-eslint/strict-boolean-expressions': 'off', // TODO: remove and fix later
    '@typescript-eslint/prefer-nullish-coalescing': 'off', // TODO: remove and fix later
    '@typescript-eslint/explicit-function-return-type': 'off', // TODO: remove and fix later
    '@typescript-eslint/no-unsafe-argument': ['off'], // TODO: remove and fix later
    '@typescript-eslint/no-non-null-assertion': 'off', // TODO: remove and fix later
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        disallowTypeAnnotations: false
      }
    ], // TODO: remove and fix later
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
