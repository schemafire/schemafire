const { supportDir, isLiveTest, createDBPrefix } = require('./support/utils');

const coverage = {
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
};

if (!process.env.CI && !process.env.FIREBASE_CONFIG) {
  process.env.FIREBASE_CONFIG = '{}';
}

global.__DB_PREFIX__ = createDBPrefix();

module.exports = {
  cacheDirectory: '<rootDir>/.jest',
  collectCoverage: isLiveTest(),
  projects: ['<rootDir>/@skeema/*/'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  ...(isLiveTest() ? coverage : {}),
  globalTeardown: supportDir('jest/jest.teardown.ts'),
  globalSetup: supportDir('jest/jest.setup.ts'),
};
