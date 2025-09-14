/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: false,
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    node: true,
    es6: true,
    browser: false
  },
  ignorePatterns: [
    '**/dist/**',
    '**/build/**',
    '**/node_modules/**'
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
