module.exports = {
  root: true,
  env: {
    browser: false,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'no-debugger': 'error',
  },
  ignorePatterns: [
    'dist/',
    'coverage/',
    'node_modules/',
    '**/*.config.js',
    '.eslintrc.js',
  ],
};
