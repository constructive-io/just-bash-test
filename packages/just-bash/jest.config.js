/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',

  // Match both __tests__ and colocated test files
  testMatch: ['**/?(*.)+(test|spec).{ts,tsx,js,jsx}'],

  // Ignore build artifacts and type declarations
  testPathIgnorePatterns: ['/dist/', '\\.d\\.ts$'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  // Only watch js, ts, and sql files
  watchPathIgnorePatterns: [
    '/dist/',
    '/node_modules/'
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'sql'],

  // ESM support for just-bash
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // Don't transform just-bash since it's already ESM
  transformIgnorePatterns: [
    '/node_modules/(?!just-bash)'
  ],
};